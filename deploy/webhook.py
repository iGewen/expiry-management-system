#!/usr/bin/env python3
import os
import hmac
import hashlib
import subprocess
import time
import requests
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

SECRET = 'Hehaifeng520@'.encode()
PROJECT_DIR = '/var/wwwroot/expiry-management-system'
MAX_RETRIES = 3
FEISHU_WEBHOOK = 'https://open.feishu.cn/open-apis/bot/v2/hook/28c0c0b8-d749-4ace-b572-ac69d9f85f45'

def run_command(cmd, cwd=PROJECT_DIR, check=True):
    print(f"执行: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"错误: {result.stderr}")
        raise Exception(result.stderr)
    print(f"输出: {result.stdout}")
    return result

def check_containers_running():
    """检查关键容器是否运行"""
    result = run_command("docker-compose ps --services", check=False)
    if result.returncode != 0:
        return False
    
    services = result.stdout.strip().split('\n')
    for service in services:
        if not service:
            continue
        check_result = run_command(f"docker-compose ps {service}", check=False)
        if 'Up' not in check_result.stdout:
            print(f"容器 {service} 未启动: {check_result.stdout}")
            return False
    return True

def notify_feishu(message, msg_type='text'):
    """发送飞书通知"""
    try:
        data = {
            "msg_type": msg_type,
            "content": {
                "text": message
            }
        }
        response = requests.post(FEISHU_WEBHOOK, headers={'Content-Type': 'application/json'}, data=json.dumps(data), timeout=10)
        print(f"飞书通知发送结果: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"飞书通知发送失败: {e}")
        return False

def notify_success():
    """部署成功通知"""
    message = f"✅ 部署成功\n📦 项目：expiry-management-system\n🖥 服务器：115.190.199.9\n⏰ 时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    notify_feishu(message)

def notify_failure(error_msg):
    """部署失败通知"""
    message = f"❌ 部署失败\n📦 项目：expiry-management-system\n🖥 服务器：115.190.199.9\n⏰ 时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n🔴 错误：{error_msg}"
    notify_feishu(message)

def deploy():
    import sys
    print(f'[{datetime.now()}] 开始部署...')
    sys.stdout.flush()
    
    # 检查是否有部署在进行中
    lock_file = '/tmp/deploy.lock'
    if os.path.exists(lock_file):
        print(f'[{datetime.now()}] 部署已在进行中，跳过')
        notify_feishu('⏸ 部署跳过\n📦 项目：expiry-management-system\n🖥 服务器：115.190.199.9\n⏰ 时间：' + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + '\n🔔 原因：已有部署在进行中')
        return
    
    # 创建锁文件
    try:
        with open(lock_file, 'w') as f:
            f.write(str(os.getpid()))
        print(f'[{datetime.now()}] 创建部署锁文件')
    except Exception as e:
        print(f'[{datetime.now()}] 创建锁文件失败: {e}')
    
    try:
        for retry in range(MAX_RETRIES):
            try:
                print(f'[{datetime.now()}] 尝试部署 (第{retry + 1}次)...')
                
                # 1. 拉取最新代码
                run_command('git fetch origin main')
                local_commit = run_command('git rev-parse HEAD', check=False).stdout.strip()
                remote_commit = run_command('git rev-parse origin/main', check=False).stdout.strip()
                
                if local_commit == remote_commit:
                    print('代码已是最新，跳过部署')
                    return
                
                run_command('git reset --hard origin/main')
                
                # 2. 停止旧容器
                print('停止旧容器...')
                run_command('docker-compose down', check=False)
                time.sleep(2)
                
                # 3. 构建并启动
                print('构建镜像...')
                build_result = run_command('docker-compose build --no-cache', check=False)
                if build_result.returncode != 0:
                    print(f'构建失败: {build_result.stderr}')
                    raise Exception('构建失败')
                
                print('启动容器...')
                up_result = run_command('docker-compose up -d', check=False)
                if up_result.returncode != 0:
                    print(f'启动失败: {up_result.stderr}')
                    raise Exception('启动失败')
                
                # 4. 等待容器启动
                time.sleep(10)
                
                # 5. 检查容器状态
                if check_containers_running():
                    print(f'[{datetime.now()}] 部署成功！')
                    notify_success()
                    return
                else:
                    raise Exception('部分容器未成功启动')
                    
            except Exception as e:
                print(f'[{datetime.now()}] 部署失败: {e}')
                if retry < MAX_RETRIES - 1:
                    print(f'[{datetime.now()}] 等待 10 秒后重试...')
                    time.sleep(10)
                else:
                    print(f'[{datetime.now()}] 已重试 {MAX_RETRIES} 次，仍然失败')
                    notify_failure(f'部署失败: {e}')
                    # 最后尝试一次简单启动作为兜底
                    print('尝试简单启动作为兜底...')
                    run_command('docker-compose down', check=False)
                    time.sleep(2)
                    run_command('docker-compose up -d', check=False)
                    time.sleep(10)
    finally:
        # 无论成功失败，都删除锁文件
        if os.path.exists(lock_file):
            try:
                os.remove(lock_file)
                print(f'[{datetime.now()}] 删除部署锁文件')
            except Exception as e:
                print(f'[{datetime.now()}] 删除锁文件失败: {e}')

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/webhook':
            self.send_error(404)
            return
        
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        # 验证签名
        signature = self.headers.get('X-Hub-Signature-256', '')
        if signature:
            expected = 'sha256=' + hmac.new(SECRET, body, hashlib.sha256).hexdigest()
            if not hmac.compare_digest(signature, expected):
                print(f'[{datetime.now()}] 签名验证失败')
                self.send_error(401)
                return
        else:
            print(f'[{datetime.now()}] 无签名，跳过验证')
        
        try:
            payload = json.loads(body)
        except json.JSONDecodeError as e:
            print(f'[{datetime.now()}] JSON解析错误: {e}, body: {body}')
            self.send_response(400)
            self.end_headers()
            self.wfile.write('无效的JSON'.encode('utf-8'))
            return
        
        branch = payload.get('ref', '').replace('refs/heads/', '')
        
        if branch != 'main':
            self.send_response(200)
            self.end_headers()
            self.wfile.write(f'忽略分支: {branch}'.encode('utf-8'))
            return
        
        self.send_response(202)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write('部署任务已启动'.encode('utf-8'))
        
        # 执行部署，捕获所有异常
        try:
            deploy()
        except Exception as e:
            print(f'[{datetime.now()}] deploy()执行异常: {e}')
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 9000), Handler)
    print('Webhook 服务已启动，监听端口 9000')
    server.serve_forever()

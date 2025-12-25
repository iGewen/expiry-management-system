<template>
  <div class="policy-page">
    <el-card shadow="never" class="policy-card">
      <template #header>
        <div class="card-header">
          <h1>隐私政策</h1>
          <el-button @click="goBack" size="small">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <div class="policy-content">
        <p class="update-time">更新日期：{{ updateDate }}</p>

        <section>
          <h2>欢迎使用商品保质期管理系统</h2>
          <p>
            我们深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。我们致力于维持您对我们的信任，
            恪守以下原则，保护您的个人信息：权责一致原则、目的明确原则、选择同意原则、最小必要原则、
            确保安全原则、主体参与原则、公开透明原则等。同时，我们承诺，我们将按业界成熟的安全标准，
            采取相应的安全保护措施来保护您的个人信息。
          </p>
        </section>

        <section>
          <h2>一、我们如何收集和使用您的个人信息</h2>
          <p>个人信息是指以电子或者其他方式记录的能够单独或者与其他信息结合识别特定自然人身份或者反映特定自然人活动情况的各种信息。</p>
          
          <h3>1.1 注册账号</h3>
          <p>
            当您注册账号时，我们会收集您的<strong>用户名、密码、手机号</strong>。这些信息是为了完成账号注册、
            登录验证以及账号安全保障所必需的。如果您不提供这些信息，您将无法正常使用我们的服务。
          </p>

          <h3>1.2 商品管理</h3>
          <p>
            当您使用商品管理功能时，我们会收集您输入的<strong>商品名称、生产日期、保质期、提醒天数</strong>等信息。
            这些信息仅用于为您提供商品保质期管理和提醒服务。
          </p>

          <h3>1.3 日志信息</h3>
          <p>
            为了保障系统安全和服务质量，我们会自动收集您的<strong>操作记录、IP地址、设备信息</strong>。
            这些信息用于系统安全监控、问题排查和服务改进。
          </p>
        </section>

        <section>
          <h2>二、我们如何存储和保护您的个人信息</h2>
          
          <h3>2.1 存储地点</h3>
          <p>我们在中华人民共和国境内收集和产生的个人信息，将存储在中华人民共和国境内。</p>

          <h3>2.2 存储期限</h3>
          <p>
            一般而言，我们仅为实现目的所必需的最短时间保留您的个人信息。当您注销账号后，
            我们将根据相关法律法规的要求保存您的相关信息。超出保存期限后，我们将对您的个人信息进行删除或匿名化处理。
          </p>

          <h3>2.3 安全措施</h3>
          <ul>
            <li>我们使用加密技术（如SSL/TLS）对敏感数据进行加密传输和存储</li>
            <li>密码采用bcrypt加密算法进行单向加密存储</li>
            <li>建立严格的数据访问权限控制和审计机制</li>
            <li>定期进行安全评估和漏洞扫描</li>
            <li>制定了个人信息安全事件应急预案</li>
          </ul>
        </section>

        <section>
          <h2>三、我们如何共享、转让、公开披露您的个人信息</h2>
          
          <h3>3.1 共享</h3>
          <p>
            我们不会向第三方共享您的个人信息，除非：
          </p>
          <ul>
            <li>获得您的明确同意</li>
            <li>根据法律法规或政府主管部门的要求</li>
            <li>为维护社会公共利益</li>
            <li>为维护本平台或其他用户的合法权益</li>
          </ul>

          <h3>3.2 转让</h3>
          <p>我们不会将您的个人信息转让给任何公司、组织和个人，但以下情况除外：</p>
          <ul>
            <li>获得您的明确同意</li>
            <li>在涉及合并、收购或破产清算时，如涉及到个人信息转让，我们会要求新的持有您个人信息的公司、组织继续受本政策的约束</li>
          </ul>

          <h3>3.3 公开披露</h3>
          <p>我们仅会在以下情况下，公开披露您的个人信息：</p>
          <ul>
            <li>获得您明确同意后</li>
            <li>基于法律的披露：在法律、法律程序、诉讼或政府主管部门强制性要求的情况下，我们可能会公开披露您的个人信息</li>
          </ul>
        </section>

        <section>
          <h2>四、您的权利</h2>
          <p>按照中国相关的法律、法规、标准，以及其他国家、地区的通行做法，我们保障您对自己的个人信息行使以下权利：</p>
          
          <h3>4.1 访问您的个人信息</h3>
          <p>您有权访问您的个人信息，法律法规规定的例外情况除外。您可以通过用户设置页面查看您的账号信息。</p>

          <h3>4.2 更正您的个人信息</h3>
          <p>当您发现我们处理的关于您的个人信息有错误时，您有权要求我们做出更正。您可以通过用户设置页面自行更正。</p>

          <h3>4.3 删除您的个人信息</h3>
          <p>在以下情形中，您可以向我们提出删除个人信息的请求：</p>
          <ul>
            <li>我们处理个人信息的行为违反法律法规</li>
            <li>我们收集、使用您的个人信息，却未征得您的同意</li>
            <li>我们处理个人信息的行为违反了与您的约定</li>
            <li>您不再使用我们的产品或服务，或您注销了账号</li>
          </ul>

          <h3>4.4 注销账号</h3>
          <p>您可以联系系统管理员申请注销您的账号。在注销账号之后，我们将停止为您提供产品或服务，
            并根据您的要求删除您的个人信息，法律法规另有规定的除外。</p>
        </section>

        <section>
          <h2>五、本政策如何更新</h2>
          <p>
            我们的隐私政策可能变更。未经您明确同意，我们不会削减您按照本隐私政策所应享有的权利。
            我们会在本页面上发布对本政策所做的任何变更。对于重大变更，我们还会提供更为显著的通知
            （包括对于某些服务，我们会通过系统通知的方式，说明隐私政策的具体变更内容）。
          </p>
        </section>

        <section>
          <h2>六、如何联系我们</h2>
          <p>
            如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式与我们联系：
          </p>
          <ul>
            <li>联系系统管理员</li>
            <li>通过系统内置的反馈功能提交您的问题</li>
          </ul>
          <p>
            一般情况下，我们将在15个工作日内回复。
          </p>
        </section>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const router = useRouter()
const updateDate = dayjs().format('YYYY年MM月DD日')

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
@import '@/styles/variables.scss';

.policy-page {
  min-height: 100vh;
  background-color: $bg-gray;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.policy-card {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h1 {
      font-size: 24px;
      color: $text-primary;
      margin: 0;
    }
  }
}

.policy-content {
  line-height: 1.8;
  color: $text-regular;

  .update-time {
    color: $text-secondary;
    font-size: $font-size-small;
    margin-bottom: 20px;
  }

  section {
    margin-bottom: 30px;

    h2 {
      font-size: 20px;
      color: $text-primary;
      margin: 24px 0 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid $primary-color;
    }

    h3 {
      font-size: 16px;
      color: $text-primary;
      margin: 20px 0 12px;
    }

    p {
      margin: 12px 0;
      text-indent: 2em;
    }

    ul {
      margin: 12px 0;
      padding-left: 2em;

      li {
        margin: 8px 0;
        list-style-type: disc;
      }
    }

    strong {
      color: $primary-color;
      font-weight: 600;
    }
  }
}
</style>

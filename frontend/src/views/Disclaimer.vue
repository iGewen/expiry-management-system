<template>
  <div class="disclaimer-page">
    <el-card shadow="never" class="disclaimer-card">
      <template #header>
        <div class="card-header">
          <h1>免责声明</h1>
          <el-button @click="goBack" size="small">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <div class="disclaimer-content">
        <p class="update-time">更新日期：{{ updateDate }}</p>

        <section>
          <h2>重要提示</h2>
          <p>
            在使用商品保质期管理系统（以下简称"本系统"）之前，请您仔细阅读并充分理解本免责声明的全部内容。
            一旦您开始使用本系统，即视为您已阅读、理解并同意接受本免责声明的全部内容。
          </p>
        </section>

        <section>
          <h2>一、服务性质</h2>
          <p>
            本系统是一个商品保质期管理工具，旨在帮助用户记录和管理商品的保质期信息，并提供到期提醒服务。
            本系统提供的所有功能和服务仅供参考，不构成任何形式的专业建议。
          </p>
        </section>

        <section>
          <h2>二、用户责任</h2>
          
          <h3>2.1 信息准确性</h3>
          <p>
            用户应对其输入的商品信息（包括但不限于商品名称、生产日期、保质期等）的真实性、准确性和完整性负责。
            因用户输入信息错误导致的任何损失，本系统不承担任何责任。
          </p>

          <h3>2.2 自主判断</h3>
          <p>
            用户应当对本系统提供的提醒信息进行独立判断，并根据实际情况（如商品存储条件、包装完整性等）
            做出最终决策。本系统的提醒服务仅作参考，不应作为商品是否可用的唯一判断依据。
          </p>

          <h3>2.3 账号安全</h3>
          <p>
            用户应妥善保管自己的账号和密码，对使用该账号和密码进行的一切操作负完全责任。
            因用户自身原因（如密码泄露、与他人共享账号等）导致的任何损失，本系统不承担责任。
          </p>
        </section>

        <section>
          <h2>三、服务限制</h2>
          
          <h3>3.1 技术限制</h3>
          <p>
            本系统可能受到计算机病毒、网络攻击、系统维护、网络拥堵等因素的影响，导致服务中断、延迟或数据丢失。
            我们将尽力保障服务的稳定性和数据安全，但不保证服务绝对不会中断或完全免于错误。
          </p>

          <h3>3.2 提醒功能</h3>
          <p>
            本系统的到期提醒功能可能因技术故障、网络问题等原因无法及时送达。用户不应完全依赖本系统的提醒功能，
            应建立多重提醒机制或定期主动检查商品状态。
          </p>

          <h3>3.3 数据存储</h3>
          <p>
            虽然我们会采取必要的技术措施保护用户数据，但无法完全排除因不可抗力、黑客攻击、系统故障等原因
            导致的数据丢失风险。建议用户定期导出备份重要数据。
          </p>
        </section>

        <section>
          <h2>四、免责事项</h2>
          <p>在以下情况下，本系统不承担任何责任：</p>
          <ul>
            <li>因用户输入信息错误、不完整或虚假导致的任何后果</li>
            <li>因用户未及时查看提醒信息或未采取适当措施导致的损失</li>
            <li>因不可抗力（如地震、火灾、战争、政府行为等）导致的服务中断</li>
            <li>因第三方行为（如黑客攻击、病毒入侵等）导致的数据泄露或损失</li>
            <li>因用户设备故障、网络问题等非本系统原因导致的服务异常</li>
            <li>因商品保质期的自然变化、存储条件等客观因素导致的商品质量问题</li>
            <li>因用户违反法律法规或本系统使用规则导致的任何后果</li>
          </ul>
        </section>

        <section>
          <h2>五、知识产权</h2>
          <p>
            本系统的所有内容，包括但不限于文本、图片、软件、程序、数据等，均受著作权法、商标法和其他
            相关法律法规的保护。未经书面许可，任何单位和个人不得擅自复制、传播、展示、镜像、上传、下载、
            使用本系统的任何内容。
          </p>
        </section>

        <section>
          <h2>六、法律适用</h2>
          <p>
            本免责声明的解释、效力及纠纷的解决，适用中华人民共和国法律。若用户和本系统之间发生任何纠纷或争议，
            首先应友好协商解决；协商不成的，用户同意将纠纷或争议提交本系统所在地有管辖权的人民法院管辖。
          </p>
        </section>

        <section>
          <h2>七、免责声明的修改和更新</h2>
          <p>
            我们有权根据需要随时修改本免责声明的内容。修改后的免责声明一旦在系统上公布即有效代替原来的免责声明。
            您继续使用本系统将被视为接受修改后的免责声明。如果您不同意修改后的内容，请立即停止使用本系统。
          </p>
        </section>

        <section>
          <h2>八、特别声明</h2>
          <p class="highlight">
            本系统仅作为商品保质期管理的辅助工具，不能替代用户的专业判断。对于食品、药品等特殊商品，
            用户应当严格遵守国家相关法律法规和行业标准，不得将过期或变质的商品用于食用或其他用途。
            因违反相关规定导致的任何后果，用户应自行承担全部责任。
          </p>
        </section>

        <section>
          <h2>九、联系我们</h2>
          <p>
            如果您对本免责声明有任何疑问，请联系系统管理员或通过系统内置的反馈功能与我们联系。
          </p>
        </section>

        <div class="final-notice">
          <p><strong>再次提醒：</strong></p>
          <p>
            使用本系统即表示您已完全理解并同意本免责声明的所有内容。如果您不同意本免责声明的任何内容，
            请立即停止使用本系统。
          </p>
        </div>
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

.disclaimer-page {
  min-height: 100vh;
  background-color: $bg-gray;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.disclaimer-card {
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

.disclaimer-content {
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
      border-bottom: 2px solid $warning-color;
    }

    h3 {
      font-size: 16px;
      color: $text-primary;
      margin: 20px 0 12px;
    }

    p {
      margin: 12px 0;
      text-indent: 2em;

      &.highlight {
        background-color: #fff3cd;
        border-left: 4px solid $warning-color;
        padding: 12px 16px;
        text-indent: 0;
        color: #856404;
      }
    }

    ul {
      margin: 12px 0;
      padding-left: 2em;

      li {
        margin: 8px 0;
        list-style-type: disc;
      }
    }
  }

  .final-notice {
    background-color: $primary-light;
    border-left: 4px solid $primary-color;
    padding: 16px 20px;
    margin-top: 30px;
    border-radius: $border-radius-base;

    p {
      margin: 8px 0;
      text-indent: 0;

      strong {
        color: $primary-color;
        font-size: 16px;
      }
    }
  }
}
</style>

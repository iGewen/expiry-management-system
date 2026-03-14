import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始数据迁移...');

  // 获取所有没有 expiryDate 或 status 字段的商品
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { expiryDate: null },
        { status: null }
      ]
    }
  });

  console.log(`找到 ${products.length} 个需要更新的商品`);

  let updated = 0;
  let failed = 0;

  for (const product of products) {
    try {
      // 计算过期日期
      const productionDate = new Date(product.productionDate);
      const expiryDate = new Date(productionDate);
      expiryDate.setDate(expiryDate.getDate() + product.shelfLife);

      // 计算状态
      const now = new Date();
      const reminderDate = new Date(expiryDate);
      reminderDate.setDate(reminderDate.getDate() - product.reminderDays);

      let status = 'NORMAL';
      if (now > expiryDate) {
        status = 'EXPIRED';
      } else if (now > reminderDate) {
        status = 'WARNING';
      }

      // 更新商品
      await prisma.product.update({
        where: { id: product.id },
        data: {
          expiryDate,
          status: status as any
        }
      });

      updated++;
    } catch (error) {
      console.error(`更新商品 ${product.id} 失败:`, error);
      failed++;
    }
  }

  console.log(`迁移完成: 成功 ${updated}, 失败 ${failed}`);
}

main()
  .catch((e) => {
    console.error('迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

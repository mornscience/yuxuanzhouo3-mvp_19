export function generateContractHTML(companyName: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>B2B 软件产品采购及服务协议</title>
    <style>
        body { font-family: 'SimSun', serif; line-height: 1.6; margin: 40px; }
        h1 { text-align: center; margin-bottom: 30px; }
        h2 { margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 5px; }
        p { margin: 8px 0; text-indent: 2em; }
        .signature { margin-top: 50px; }
        .signature div { margin: 15px 0; }
    </style>
</head>
<body>
    <h1>B2B 软件产品采购及服务协议</h1>

    <p><strong>甲方（采购方）：</strong> ${companyName || '____________________'}</p>
    <p><strong>乙方（服务方）：</strong> 本公司</p>

    <p>鉴于甲方业务发展需要，拟向乙方采购相关软件产品及技术服务，经双方友好协商，本着平等自愿、诚实信用的原则，达成如下协议：</p>

    <h2>第一条 采购内容</h2>
    <p>1.1 软件名称：产品获客系统企业版 (Pro)</p>
    <p>1.2 交付时间：自本合同签署之日起 5 个工作日内。</p>

    <h2>第二条 费用及支付方式</h2>
    <p>2.1 本合同总金额为人民币（大写）：_______________ 元整（¥_________）。</p>
    <p>2.2 支付节奏：合同签订后 3 日内支付 50% 预付款，验收合格后支付剩余 50% 尾款。</p>

    <h2>第三条 交付与验收</h2>
    <p>3.1 乙方应按照本合同约定的时间交付软件产品，并提供相应的技术文档。</p>
    <p>3.2 甲方应在收到产品后 3 个工作日内完成验收，如有问题应及时书面提出。</p>

    <h2>第四条 售后服务</h2>
    <p>4.1 乙方提供自交付之日起 12 个月的技术支持服务。</p>
    <p>4.2 支持范围包括：产品使用咨询、故障排查、版本更新。</p>

    <h2>第五条 保密条款</h2>
    <p>5.1 双方应对在合作过程中知悉的对方商业秘密和技术信息予以保密。</p>
    <p>5.2 保密期限自本合同生效之日起 3 年。</p>

    <h2>第六条 违约责任</h2>
    <p>6.1 任何一方违反本合同约定，应承担相应的违约责任，赔偿对方因此造成的损失。</p>

    <h2>第七条 争议解决</h2>
    <p>7.1 因履行本合同发生的争议，双方应友好协商解决；协商不成的，提交乙方所在地人民法院诉讼解决。</p>

    <div class="signature">
        <div><strong>甲方（盖章）：</strong> ____________________</div>
        <div><strong>代表人（签字）：</strong> ____________________</div>
        <div><strong>日期：</strong> ______年______月______日</div>

        <div style="margin-top: 30px;"><strong>乙方（盖章）：</strong> 本公司</div>
        <div><strong>代表人（签字）：</strong> ____________________</div>
        <div><strong>日期：</strong> ______年______月______日</div>
    </div>
</body>
</html>`
}
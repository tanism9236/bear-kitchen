import type { Recipe } from '@/types';
import { tagId, generateId } from '@/utils/id';

/**
 * Sample recipes for initial development.
 * Cover images use null — the UI shows a warm gradient placeholder.
 */
export function createSampleRecipes(): Recipe[] {
  const now = new Date();
  const ts = (offset: number) =>
    new Date(now.getTime() - offset * 86400000).toISOString();

  return [
    {
      id: generateId(),
      name: '番茄炒蛋',
      coverImage: null,
      category: 'home',
      tags: [
        tagId('中餐', 'cuisine'),
        tagId('蛋类', 'ingredient'),
        tagId('咸鲜', 'flavor'),
        tagId('炒', 'method'),
      ],
      ingredients: [
        { id: generateId(), name: '鸡蛋', amount: '3', unit: '个' },
        { id: generateId(), name: '番茄', amount: '300', unit: 'g' },
        { id: generateId(), name: '食用油', amount: '15', unit: 'g' },
        { id: generateId(), name: '盐', amount: '3', unit: 'g' },
        { id: generateId(), name: '白糖', amount: '5', unit: 'g' },
      ],
      steps: [
        { id: generateId(), text: '鸡蛋打散，加少许盐搅拌均匀。' },
        { id: generateId(), text: '番茄洗净，切块备用。' },
        { id: generateId(), text: '锅中热油，倒入蛋液，快速翻炒至凝固后盛出。' },
        { id: generateId(), text: '锅中加少许油，放入番茄块翻炒出汁。' },
        { id: generateId(), text: '加入白糖、盐调味，倒回鸡蛋翻炒均匀即可。' },
      ],
      createdAt: ts(10),
      updatedAt: ts(10),
    },
    {
      id: generateId(),
      name: '三杯鸡',
      coverImage: null,
      category: 'home',
      tags: [
        tagId('中餐', 'cuisine'),
        tagId('鸡肉', 'ingredient'),
        tagId('咸鲜', 'flavor'),
        tagId('焖', 'method'),
      ],
      ingredients: [
        { id: generateId(), name: '鸡腿', amount: '4', unit: '只' },
        { id: generateId(), name: '酱油', amount: '3', unit: '汤匙' },
        { id: generateId(), name: '米酒', amount: '3', unit: '汤匙' },
        { id: generateId(), name: '黑麻油', amount: '3', unit: '汤匙' },
        { id: generateId(), name: '九层塔', amount: '1', unit: '把' },
        { id: generateId(), name: '姜', amount: '20', unit: 'g' },
        { id: generateId(), name: '蒜', amount: '6', unit: '瓣' },
      ],
      steps: [
        { id: generateId(), text: '鸡腿洗净切块，焯水去血沫，沥干备用。' },
        { id: generateId(), text: '黑麻油入锅，小火爆香姜片至微焦。' },
        { id: generateId(), text: '加入蒜瓣爆香，放入鸡块煎至表面金黄。' },
        { id: generateId(), text: '加入酱油、米酒，大火煮开后转小火焖煮 15 分钟。' },
        { id: generateId(), text: '收汁后加入九层塔，翻拌均匀即可出锅。' },
      ],
      createdAt: ts(8),
      updatedAt: ts(8),
    },
    {
      id: generateId(),
      name: '粉蒸肉',
      coverImage: null,
      category: 'private',
      tags: [
        tagId('中餐', 'cuisine'),
        tagId('猪肉', 'ingredient'),
        tagId('咸鲜', 'flavor'),
        tagId('蒸', 'method'),
      ],
      ingredients: [
        { id: generateId(), name: '五花肉', amount: '500', unit: 'g' },
        { id: generateId(), name: '蒸肉米粉', amount: '150', unit: 'g' },
        { id: generateId(), name: '酱油', amount: '2', unit: '汤匙' },
        { id: generateId(), name: '料酒', amount: '1', unit: '汤匙' },
        { id: generateId(), name: '豆瓣酱', amount: '1', unit: '汤匙' },
        { id: generateId(), name: '土豆', amount: '2', unit: '个' },
      ],
      steps: [
        { id: generateId(), text: '五花肉切厚片，加入酱油、料酒、豆瓣酱腌制 30 分钟。' },
        { id: generateId(), text: '将蒸肉米粉倒入腌好的肉中，拌匀使每片肉均匀裹粉。' },
        { id: generateId(), text: '土豆去皮切块，铺在蒸笼底部。' },
        { id: generateId(), text: '将裹好米粉的肉片码放在土豆上。' },
        { id: generateId(), text: '大火蒸 60 分钟至肉酥烂即可。' },
      ],
      createdAt: ts(6),
      updatedAt: ts(6),
    },
    {
      id: generateId(),
      name: '黑椒牛柳',
      coverImage: null,
      category: 'home',
      tags: [
        tagId('中餐', 'cuisine'),
        tagId('牛肉', 'ingredient'),
        tagId('浓郁', 'flavor'),
        tagId('炒', 'method'),
      ],
      ingredients: [
        { id: generateId(), name: '牛里脊', amount: '300', unit: 'g' },
        { id: generateId(), name: '黑胡椒', amount: '2', unit: '茶匙' },
        { id: generateId(), name: '蚝油', amount: '1', unit: '汤匙' },
        { id: generateId(), name: '酱油', amount: '1', unit: '汤匙' },
        { id: generateId(), name: '料酒', amount: '1', unit: '汤匙' },
        { id: generateId(), name: '洋葱', amount: '1', unit: '个' },
        { id: generateId(), name: '青椒', amount: '1', unit: '个' },
      ],
      steps: [
        { id: generateId(), text: '牛肉切条，加酱油、料酒、黑胡椒腌制 15 分钟。' },
        { id: generateId(), text: '洋葱、青椒切块备用。' },
        { id: generateId(), text: '热锅冷油，大火滑炒牛柳至变色盛出。' },
        { id: generateId(), text: '锅中留底油，炒洋葱和青椒至断生。' },
        { id: generateId(), text: '倒回牛柳，加蚝油和黑胡椒翻炒均匀即可。' },
      ],
      createdAt: ts(4),
      updatedAt: ts(4),
    },
    {
      id: generateId(),
      name: '清蒸鱼',
      coverImage: null,
      category: 'home',
      tags: [
        tagId('中餐', 'cuisine'),
        tagId('鱼', 'ingredient'),
        tagId('清淡', 'flavor'),
        tagId('蒸', 'method'),
      ],
      ingredients: [
        { id: generateId(), name: '鲈鱼', amount: '1', unit: '条' },
        { id: generateId(), name: '葱', amount: '3', unit: '根' },
        { id: generateId(), name: '姜', amount: '20', unit: 'g' },
        { id: generateId(), name: '蒸鱼豉油', amount: '3', unit: '汤匙' },
        { id: generateId(), name: '食用油', amount: '30', unit: 'g' },
      ],
      steps: [
        { id: generateId(), text: '鱼处理干净，两面划几刀，抹少许料酒。' },
        { id: generateId(), text: '盘底铺葱姜，放上鱼，鱼身上也放些葱姜。' },
        { id: generateId(), text: '水开后大火蒸 8-10 分钟。' },
        { id: generateId(), text: '倒掉蒸出的汤汁，去掉葱姜，铺上新鲜葱丝。' },
        { id: generateId(), text: '淋上蒸鱼豉油，浇上热油激发香气即可。' },
      ],
      createdAt: ts(2),
      updatedAt: ts(2),
    },
    {
      id: generateId(),
      name: '酸辣汤',
      coverImage: null,
      category: 'soup',
      tags: [
        tagId('中餐', 'cuisine'),
        tagId('酸辣', 'flavor'),
        tagId('煮', 'method'),
      ],
      ingredients: [
        { id: generateId(), name: '豆腐', amount: '1', unit: '块' },
        { id: generateId(), name: '木耳', amount: '50', unit: 'g' },
        { id: generateId(), name: '鸡蛋', amount: '2', unit: '个' },
        { id: generateId(), name: '醋', amount: '3', unit: '汤匙' },
        { id: generateId(), name: '白胡椒粉', amount: '1', unit: '茶匙' },
        { id: generateId(), name: '淀粉', amount: '2', unit: '汤匙' },
      ],
      steps: [
        { id: generateId(), text: '豆腐切条，木耳泡发切丝，鸡蛋打散备用。' },
        { id: generateId(), text: '锅中加水烧开，放入豆腐和木耳丝煮 3 分钟。' },
        { id: generateId(), text: '加醋、白胡椒粉、盐、酱油调味。' },
        { id: generateId(), text: '水淀粉勾芡至浓稠。' },
        { id: generateId(), text: '淋入蛋液搅散，撒葱花即可。' },
      ],
      createdAt: ts(1),
      updatedAt: ts(1),
    },
  ];
}

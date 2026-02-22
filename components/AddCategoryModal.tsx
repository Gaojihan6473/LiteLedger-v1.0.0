import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { Button } from './Button';
import { TransactionType, SubCategory } from '../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: {
    name: string;
    iconName: string;
    type: TransactionType;
    color: string;
    subCategories?: SubCategory[];
  }) => void;
  defaultType?: TransactionType;
}

const ICON_OPTIONS = [
  // 餐饮美食
  'Utensils', 'Coffee', 'Pizza', 'ChefHat', 'IceCream', 'Cookie', 'Apple', 'Cake',
  // 交通出行
  'Car', 'Bus', 'Train', 'Plane', 'Ship', 'Bike', 'Footprints', 'MapPin', 'Navigation',
  // 购物消费
  'ShoppingBag', 'CreditCard', 'Wallet', 'Gift', 'Package', 'Tag', 'Truck', 'Store',
  // 居家生活
  'Home', 'Building', 'Building2', 'House', 'Warehouse', 'TreeDeciduous', 'Flower2', 'Leaf',
  // 娱乐休闲
  'Gamepad2', 'Music', 'Film', 'Tv', 'Book', 'Headphones', 'Camera', 'Image', 'Mic',
  // 运动健康
  'Dumbbell', 'Heart', 'Activity', 'Stethoscope', 'Pill', 'Bandage', 'Syringe', 'Thermometer',
  // 教育职业
  'GraduationCap', 'Briefcase', 'Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Wifi',
  // 通讯网络
  'Phone', 'Smartphone', 'Tablet', 'Mail', 'MessageCircle', 'Send', 'Signal', 'Satellite',
  // 金融理财
  'Banknote', 'DollarSign', 'TrendingUp', 'PieChart', 'BarChart', 'Landmark', 'PiggyBank', 'Coins',
  // 社交人情
  'Users', 'User', 'UserCheck', 'UserPlus', 'HeartHandshake', 'PartyPopper', 'Cake', 'Calendar',
  // 宠物
  'Cat', 'Dog', 'Bird', 'Fish', 'PawPrint', 'Turtle',
  // 母婴
  'Baby', 'Blocks',
  // 旅行
  'Hotel', 'Tent', 'Compass', 'Map', 'Ticket',
  // 生活用品
  'Shirt', 'Scissors', 'Umbrella', 'Lamp', 'Lightbulb', 'Palette', 'Brush',
  // 办公学习
  'Pen', 'Pencil', 'Ruler', 'Eraser', 'Highlighter', 'Notebook', 'FileText',
  // 时间天气
  'Clock', 'Calendar', 'Timer', 'Sun', 'Moon', 'Cloud', 'Snowflake', 'Wind',
  // 其他
  'Star', 'Smile', 'Zap', 'Flame', 'Droplet', 'Target', 'Shield', 'Lock', 'Key',
  'Flag', 'Globe', 'Anchor', 'Circle', 'Square', 'Triangle', 'Hexagon', 'Diamond',
  'Box', 'Archive', 'Container', 'Battery', 'Plug', 'Flashlight', 'Bell', 'Ghost',
  'Skull', 'Sparkles', 'Wand', 'Gem', 'Crown', 'Trophy', 'Medal', 'Award'
];

const COLOR_OPTIONS = [
  '#EF4444', '#F59E0B', '#EC4899', '#6366F1', '#8B5CF6',
  '#10B981', '#3B82F6', '#F97316', '#06B6D4', '#E11D48',
  '#84CC16', '#A855F7', '#475569', '#0D9488', '#BE185D',
  '#22C55E', '#0EA5E9', '#14B8A6', '#F43F5E', '#64748B'
];

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultType = 'expense'
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [name, setName] = useState('');
  const [iconName, setIconName] = useState('CircleDashed');
  const [color, setColor] = useState('#6366F1');
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [newSubCategory, setNewSubCategory] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Reset type when modal opens
  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
    }
  }, [isOpen, defaultType]);

  const handleAddSubCategory = () => {
    if (newSubCategory.trim()) {
      setSubCategories([
        ...subCategories,
        { id: `sub_${Date.now()}`, name: newSubCategory.trim() }
      ]);
      setNewSubCategory('');
    }
  };

  const handleRemoveSubCategory = (id: string) => {
    setSubCategories(subCategories.filter(s => s.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      iconName,
      type,
      color,
      subCategories: subCategories.length > 0 ? subCategories : undefined
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setType(defaultType);
    setName('');
    setIconName('CircleDashed');
    setColor('#6366F1');
    setSubCategories([]);
    setNewSubCategory('');
    setShowIconPicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">新增分类</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <Icon name="X" size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Type Switcher */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              类型
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    type === t
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'expense' ? '支出' : '收入'}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入分类名称"
              className="w-full h-11 px-4 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm text-slate-700 placeholder-slate-400 hover:border-slate-300 transition-colors"
            />
          </div>

          {/* Icon & Color Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Icon */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                图标
              </label>
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full h-14 rounded-xl border border-slate-200 flex items-center justify-center hover:border-slate-300 transition-colors cursor-pointer"
                style={{ backgroundColor: color + '20' }}
              >
                <Icon name={iconName} size={24} style={{ color }} />
              </button>
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                颜色
              </label>
              <div className="grid grid-cols-5 gap-1.5 h-14">
                {COLOR_OPTIONS.slice(0, 10).map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`rounded-lg transition-transform cursor-pointer ${
                      color === c ? 'scale-110 ring-2 ring-offset-1 ring-slate-400' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Icon Picker */}
          {showIconPicker && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                选择图标
              </label>
              <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => {
                      setIconName(icon);
                      setShowIconPicker(false);
                    }}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      iconName === icon
                        ? 'bg-blue-100 text-blue-600'
                        : 'hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon name={icon as any} size={18} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sub Categories */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
              二级分类 <span className="text-slate-300 font-normal">(选填)</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSubCategory}
                onChange={(e) => setNewSubCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubCategory()}
                placeholder="添加二级分类"
                className="flex-1 h-10 px-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm text-slate-700 placeholder-slate-400 hover:border-slate-300 transition-colors"
              />
              <button
                onClick={handleAddSubCategory}
                className="px-4 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors cursor-pointer"
              >
                添加
              </button>
            </div>
            {subCategories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {subCategories.map((sub) => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-full text-xs text-slate-600"
                  >
                    {sub.name}
                    <button
                      onClick={() => handleRemoveSubCategory(sub.id)}
                      className="hover:text-red-500 cursor-pointer"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1"
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};

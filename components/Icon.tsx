
import React from 'react';
import {
  Utensils, Bus, ShoppingBag, Home, Gamepad2,
  Stethoscope, GraduationCap, CircleDashed,
  Banknote, Gift, TrendingUp, Wallet, PieChart, List,
  Plus, ChevronLeft, Trash2, Calendar, CreditCard, X, Check,
  MessageCircle, QrCode, Wifi, Users, Cat, FileText,
  Briefcase, Gem, Laptop, Key, Receipt, Settings,
  ArrowRight, ArrowLeft, ArrowDown, ArrowLeftRight,
  LogOut, AlertCircle,
  // 餐饮美食
  Coffee, Pizza, ChefHat, IceCream, Cookie, Apple, Cake,
  // 交通出行
  Car, Train, Plane, Ship, Bike, Footprints, MapPin, Navigation,
  // 购物消费
  Package, Tag, Truck, Store,
  // 居家生活
  Building, Building2, House, Warehouse, TreeDeciduous, Flower2, Leaf,
  // 娱乐休闲
  Music, Film, Tv, Book, Headphones, Camera, Image, Mic,
  // 运动健康
  Dumbbell, Heart, Activity, Pill, Bandage, Syringe, Thermometer,
  // 教育职业
  Monitor, Keyboard, Mouse, Printer,
  // 通讯网络
  Phone, Smartphone, Tablet, Mail, Send, Signal, Satellite,
  // 金融理财
  DollarSign, BarChart, Landmark, PiggyBank, Coins,
  // 社交人情
  User, UserCheck, UserPlus, HeartHandshake, PartyPopper,
  // 宠物
  Dog, Bird, Fish, PawPrint, Turtle,
  // 母婴
  Baby, Blocks,
  // 旅行
  Hotel, Tent, Compass, Map, Ticket,
  // 生活用品
  Shirt, Scissors, Umbrella, Lamp, Lightbulb, Palette, Brush,
  // 办公学习
  Pen, Pencil, Ruler, Eraser, Highlighter, Notebook,
  // 时间天气
  Clock, Timer, Sun, Moon, Cloud, Snowflake, Wind,
  // 其他
  Star, Smile, Zap, Flame, Droplet, Target, Shield, Flag, Globe, Anchor, Circle, Square, Triangle, Hexagon, Diamond, Box, Archive, Container, Battery, Plug, Flashlight, Bell, BellOff, Ghost, Skull, Sparkles, Wand, Crown, Trophy, Medal, Award
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Utensils, Bus, ShoppingBag, Home, Gamepad2,
  Stethoscope, GraduationCap, CircleDashed,
  Banknote, Gift, TrendingUp, Wallet, PieChart, List,
  Plus, ChevronLeft, Trash2, Calendar, CreditCard, X, Check,
  MessageCircle, QrCode, Wifi, Users, Cat, FileText,
  Briefcase, Gem, Laptop, Key, Receipt, Settings,
  ArrowRight, ArrowLeft, ArrowDown, ArrowLeftRight,
  LogOut, AlertCircle,
  // 餐饮美食
  Coffee, Pizza, ChefHat, IceCream, Cookie, Apple, Cake,
  // 交通出行
  Car, Train, Plane, Ship, Bike, Footprints, MapPin, Navigation,
  // 购物消费
  Package, Tag, Truck, Store,
  // 居家生活
  Building, Building2, House, Warehouse, TreeDeciduous, Flower2, Leaf,
  // 娱乐休闲
  Music, Film, Tv, Book, Headphones, Camera, Image, Mic,
  // 运动健康
  Dumbbell, Heart, Activity, Pill, Bandage, Syringe, Thermometer,
  // 教育职业
  Monitor, Keyboard, Mouse, Printer,
  // 通讯网络
  Phone, Smartphone, Tablet, Mail, Send, Signal, Satellite,
  // 金融理财
  DollarSign, BarChart, Landmark, PiggyBank, Coins,
  // 社交人情
  User, UserCheck, UserPlus, HeartHandshake, PartyPopper,
  // 宠物
  Dog, Bird, Fish, PawPrint, Turtle,
  // 母婴
  Baby, Blocks,
  // 旅行
  Hotel, Tent, Compass, Map, Ticket,
  // 生活用品
  Shirt, Scissors, Umbrella, Lamp, Lightbulb, Palette, Brush,
  // 办公学习
  Pen, Pencil, Ruler, Eraser, Highlighter, Notebook,
  // 时间天气
  Clock, Timer, Sun, Moon, Cloud, Snowflake, Wind,
  // 其他
  Star, Smile, Zap, Flame, Droplet, Target, Shield, Flag, Globe, Anchor, Circle, Square, Triangle, Hexagon, Diamond, Box, Archive, Container, Battery, Plug, Flashlight, Bell, BellOff, Ghost, Skull, Sparkles, Wand, Crown, Trophy, Medal, Award
};

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, className, color, style, strokeWidth }) => {
  const IconComponent = iconMap[name] || CircleDashed;
  return <IconComponent size={size} className={className} color={color} style={style} strokeWidth={strokeWidth} />;
};

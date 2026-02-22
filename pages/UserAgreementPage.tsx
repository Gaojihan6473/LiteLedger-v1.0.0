import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export const UserAgreementPage: React.FC = () => {
  const location = useLocation();
  // 判断来源页面，如果是注册页面则返回注册页，否则返回登录页
  const referrer = location.state?.from || '/login';
  const backLink = referrer === '/register' ? '/register' : '/login';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center">
          <Link to={backLink} state={{ from: referrer }} className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft size={20} />
            <span className="text-sm">返回</span>
          </Link>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">用户协议</h1>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">一、接受条款</h2>
              <p>
                欢迎使用 LiteLedger（轻账）。当您访问或使用本应用时，表示您已阅读、理解并同意遵守本用户协议的所有条款。如果您不同意本协议的任意内容，请立即停止使用本应用。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">二、服务说明</h2>
              <p>
                LiteLedger 是一款个人记账应用，提供以下服务：
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>记录支出和收入</li>
                <li>查看交易历史</li>
                <li>分析消费统计图表</li>
                <li>追踪储蓄目标</li>
                <li>日历视图查看记录</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">三、用户账户</h2>
              <p>
                您需要注册账户才能使用本应用的部分功能。您同意：
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>提供真实、准确、完整的注册信息</li>
                <li>妥善保管您的账户密码</li>
                <li>对您的账户下发生的所有活动负责</li>
                <li>如发现任何未经授权使用您账户的行为，立即通知我们</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">四、数据存储</h2>
              <p>
                本应用为本地存储应用，您的所有数据（交易记录、分类、设置等）均存储在您设备的浏览器本地存储中。我们不会将您的数据上传到任何服务器。请您在更换设备前自行备份重要数据。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">五、知识产权</h2>
              <p>
                本应用及其全部内容、功能和技术（包括但不限于图标、界面设计、代码）的知识产权归 LiteLedger 所有。未经授权，您不得复制、修改、分发、展示或使用本应用的任何内容。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">六、免责声明</h2>
              <p>
                本应用按"原样"提供，不提供任何明示或暗示的保证。在法律允许的范围内，我们不对以下事项承担责任：
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>因使用本应用导致的任何数据丢失</li>
                <li>本应用的可用性或功能性</li>
                <li>任何第三方行为或内容</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">七、限制和终止</h2>
              <p>
                我们保留在不通知的情况下，随时限制、暂停或终止您使用本应用的权利。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">八、协议修改</h2>
              <p>
                我们有权随时修改本协议。修改后的协议将在本页面公布。继续使用本应用即表示您接受修改后的协议。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">九、联系我们</h2>
              <p>
                如对本协议有任何疑问，请通过应用内反馈渠道联系我们。
              </p>
            </section>

            <section className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                最近更新日期：2026年2月22日
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <Link to={backLink} state={{ from: referrer }}>
              <Button fullWidth>我已阅读并同意</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

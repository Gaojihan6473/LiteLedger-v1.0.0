import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export const PrivacyPolicyPage: React.FC = () => {
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
          <h1 className="text-2xl font-bold text-slate-900 mb-6">隐私政策</h1>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">一、我们如何收集信息</h2>
              <p>
                LiteLedger（轻账）是一款本地存储应用。我们仅在您明确同意的情况下收集以下信息：
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>账户信息</strong>：当您注册账户时，我们需要您提供用户名、邮箱和密码。这些信息存储在您设备的本地存储中。</li>
                <li><strong>使用数据</strong>：应用会记录您的使用偏好设置，以提升用户体验。</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">二、我们如何使用信息</h2>
              <p>我们使用收集的信息用于：</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>提供、维护和改进我们的服务</li>
                <li>验证您的身份并提供账户安全</li>
                <li>响应您的咨询和反馈</li>
                <li>发送与服务相关的通知</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">三、数据存储与安全</h2>
              <p>
                <strong>本地存储</strong>：LiteLedger 是一款本地存储应用。您的所有数据（包括交易记录、分类、设置和账户信息）都存储在您设备的浏览器本地存储中。我们不会将您的个人数据上传到任何远程服务器。
              </p>
              <p className="mt-3">
                <strong>数据安全</strong>：我们采用行业标准的安全措施保护您的数据安全。但由于互联网传输并非完全安全，我们无法保证数据的绝对安全。请妥善保管您的设备和个人账户信息。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">四、数据共享</h2>
              <p>
                我们不会出售、交易或转让您的个人信息给任何外部第三方。本应用的所有数据存储在您的本地设备中，不涉及任何数据共享行为。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">五、您的权利</h2>
              <p>根据适用法律，您享有以下权利：</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>访问权</strong>：您有权访问您的账户信息</li>
                <li><strong>更正权</strong>：您有权更正您的个人信息</li>
                <li><strong>删除权</strong>：您有权删除您的账户和个人数据</li>
                <li><strong>导出权</strong>：您有权导出您的数据副本</li>
              </ul>
              <p className="mt-3">
                您可以通过应用内的"设置"功能清除所有数据，或联系我们就上述权利提出请求。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">六、未成年人隐私</h2>
              <p>
                我们不会故意收集未满 18 岁未成年人的个人信息。如果您是未成年人，请在使用本应用前征得父母或监护人的同意。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">七、第三方服务</h2>
              <p>
                本应用可能包含第三方链接或服务，但我们不对这些第三方的隐私行为负责。我们建议您在离开本应用后阅读其他网站的隐私政策。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">八、政策的更新</h2>
              <p>
                我们可能会不时更新本隐私政策。更新后的政策将在本页面公布，并注明最新修订日期。建议您定期查阅本政策以了解任何变更。
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">九、联系我们</h2>
              <p>
                如果您对本隐私政策有任何疑问或担忧，请通过应用内反馈渠道联系我们。
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

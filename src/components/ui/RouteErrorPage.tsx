import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { AlertOctagon, RotateCcw, Home, ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import { NotFoundPage } from '@/features/auth/guards';

export function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  // If it's a true 404 response from React Router
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : (error as any)?.statusText || 'Kutilmagan tizimli xatolik yuz berdi';

  const isChunkError =
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('dynamically imported module') ||
    errorMessage.includes('Loading chunk') ||
    errorMessage.includes('error loading dynamically imported module');

  return (
    <div className="min-h-screen bg-warm-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[18px] p-8 border border-warm-200 shadow-xl text-center">
        <div className="w-16 h-16 rounded-[14px] bg-danger-light text-danger-main flex items-center justify-center mx-auto mb-5">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-charcoal-900 mb-2">
          {isChunkError ? 'Ilova yangilandi' : 'Kutilmagan xatolik yuz berdi'}
        </h1>
        <p className="text-sm text-charcoal-500 mb-6">
          {isChunkError
            ? "Tizimning yangi versiyasi yuklandi. Yangilanishlarni to'liq qo'llash uchun sahifani qayta yuklang."
            : "Sahifani yuklashda xatolik yuz berdi. Iltimos, sahifani qayta yuklang yoki bosh sahifaga o'ting."}
        </p>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-6 p-3.5 rounded-[12px] bg-warm-50 border border-warm-200 text-left overflow-auto max-h-40 shadow-2xs">
            <p className="text-xs font-mono text-danger-main font-semibold break-all">
              {errorMessage}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
            className="flex-1"
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Qayta yuklash
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="flex-1"
            leftIcon={<Home className="w-4 h-4" />}
          >
            Bosh sahifa
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DashboardSectionError() {
  const error = useRouteError();
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Kutilmagan xatolik';

  const isChunkError =
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('dynamically imported module') ||
    errorMessage.includes('Loading chunk');

  return (
    <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-warm-200 shadow-sm text-center">
      <div className="w-14 h-14 rounded-xl bg-danger-light text-danger-main flex items-center justify-center mx-auto mb-4">
        <AlertOctagon className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-bold text-charcoal-900 mb-2">
        {isChunkError ? 'Yangi versiya mavjud' : 'Ushbu bo‘limni yuklashda xatolik'}
      </h2>
      <p className="text-sm text-charcoal-500 mb-6">
        {isChunkError
          ? "Ilovaning yangi talqini chiqarilgan. Sahifani qayta yuklash orqali davom eting."
          : "Ma'lumotlarni yuklash yoki hisoblashda nosozlik yuz berdi. Iltimos, sahifani qayta yuklang."}
      </p>

      {process.env.NODE_ENV !== 'production' && (
        <div className="mb-6 p-3 rounded-lg bg-warm-50 border border-warm-200 text-left overflow-auto max-h-32 text-xs font-mono text-danger-main break-all">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          onClick={() => window.history.back()}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Orqaga
        </Button>
        <Button
          variant="primary"
          onClick={() => window.location.reload()}
          leftIcon={<RotateCcw className="w-4 h-4" />}
        >
          Qayta yuklash
        </Button>
      </div>
    </div>
  );
}

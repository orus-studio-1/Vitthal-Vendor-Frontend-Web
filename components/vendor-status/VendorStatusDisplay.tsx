'use client';

import { Clock, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface VendorStatusDisplayProps {
  status: string | null;
  applicationNumber?: string | null;
}

export default function VendorStatusDisplay({ status, applicationNumber }: VendorStatusDisplayProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          title: 'Application Under Review',
          description: 'Your vendor application is currently being reviewed by our team. We will notify you once there\'s an update.',
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          descriptionColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'agreement_sent':
      case 'agreement':
        return {
          icon: FileText,
          title: 'Agreement Sent',
          description: 'We have sent you the vendor agreement. Please check your email and sign the agreement to proceed with the approval process.',
          bgColor: 'bg-amber-50',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-900',
          descriptionColor: 'text-amber-700',
          borderColor: 'border-amber-200'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'Application Approved',
          description: 'Congratulations! Your vendor application has been approved. You can now access all vendor features.',
          bgColor: 'bg-green-50',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          descriptionColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: XCircle,
          title: 'Application Rejected',
          description: 'Unfortunately, your vendor application has been rejected. Please contact support for more information.',
          bgColor: 'bg-red-50',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          descriptionColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: AlertCircle,
          title: 'Status Unknown',
          description: 'Unable to determine your application status. Please contact support.',
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-900',
          descriptionColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-md w-full ${config.bgColor} rounded-lg shadow-lg border ${config.borderColor} p-8`}>
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full ${config.bgColor}`}>
            <Icon className={`h-12 w-12 ${config.iconColor}`} />
          </div>
        </div>
        <div className="text-center">
          <h2 className={`text-2xl font-bold mb-2 ${config.titleColor}`}>
            {config.title}
          </h2>
          {applicationNumber && (
            <div className="my-3 inline-block px-3 py-1 bg-white/70 backdrop-blur-sm rounded-full border border-gray-200/50 shadow-sm font-mono text-xs font-semibold text-gray-700">
              Application ID: <span className="text-blue-600 font-bold">{applicationNumber}</span>
            </div>
          )}
          <p className={`text-sm ${config.descriptionColor} leading-relaxed mt-2`}>
            {config.description}
          </p>
        </div>
        
        {(status === 'pending' || status === 'agreement') && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">
                Need help? Contact our support team
              </p>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

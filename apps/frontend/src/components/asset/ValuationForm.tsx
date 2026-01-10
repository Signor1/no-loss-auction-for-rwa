'use client';

import { AssetFormState, ValuationMethod } from '@/lib/asset-management';

interface ValuationFormProps {
  formState: AssetFormState;
  updateFormState: (updates: Partial<AssetFormState>) => void;
  validationErrors: Record<string, string[]>;
}

export function ValuationForm({ formState, updateFormState, validationErrors }: ValuationFormProps) {
  const handleInputChange = (field: keyof AssetFormState, value: any) => {
    updateFormState({ [field]: value });
  };

  const handleNestedChange = (parentField: keyof AssetFormState, childField: string, value: any) => {
    const parent = formState[parentField] as any;
    updateFormState({
      [parentField]: {
        ...parent,
        [childField]: value
      }
    });
  };

  const addValuationReport = () => {
    const newReport = {
      id: `report_${Date.now()}`,
      type: 'appraisal' as ValuationMethod,
      value: 0,
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      valuator: '',
      reportUrl: '',
      notes: ''
    };

    const updatedReports = [...(formState.valuation?.valuationReports || []), newReport];
    handleNestedChange('valuation', 'valuationReports', updatedReports);
  };

  const removeValuationReport = (reportId: string) => {
    const updatedReports = (formState.valuation?.valuationReports || []).filter(r => r.id !== reportId);
    handleNestedChange('valuation', 'valuationReports', updatedReports);
  };

  const updateValuationReport = (reportId: string, field: string, value: any) => {
    const updatedReports = (formState.valuation?.valuationReports || []).map(report =>
      report.id === reportId ? { ...report, [field]: value } : report
    );
    handleNestedChange('valuation', 'valuationReports', updatedReports);
  };

  return (
    <div className="space-y-6">
      {/* Primary Valuation */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Primary Valuation</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="estimatedValue" className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Value (USD) *
            </label>
            <input
              type="number"
              id="estimatedValue"
              value={formState.valuation?.estimatedValue || ''}
              onChange={(e) => handleNestedChange('valuation', 'estimatedValue', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {validationErrors['valuation.estimatedValue'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['valuation.estimatedValue'][0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="valuationMethod" className="block text-sm font-medium text-gray-700 mb-2">
              Valuation Method *
            </label>
            <select
              id="valuationMethod"
              value={formState.valuation?.valuationMethod || ''}
              onChange={(e) => handleNestedChange('valuation', 'valuationMethod', e.target.value as ValuationMethod)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select valuation method</option>
              <option value="market-comparison">Market Comparison</option>
              <option value="cost-approach">Cost Approach</option>
              <option value="income-approach">Income Approach</option>
              <option value="appraisal">Professional Appraisal</option>
              <option value="expert-opinion">Expert Opinion</option>
            </select>
            {validationErrors['valuation.valuationMethod'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['valuation.valuationMethod'][0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="valuationDate" className="block text-sm font-medium text-gray-700 mb-2">
              Valuation Date *
            </label>
            <input
              type="date"
              id="valuationDate"
              value={formState.valuation?.valuationDate || ''}
              onChange={(e) => handleNestedChange('valuation', 'valuationDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              max={new Date().toISOString().split('T')[0]}
            />
            {validationErrors['valuation.valuationDate'] && (
              <p className="mt-1 text-sm text-red-600">{validationErrors['valuation.valuationDate'][0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="valuator" className="block text-sm font-medium text-gray-700 mb-2">
              Valuator/Appraiser
            </label>
            <input
              type="text"
              id="valuator"
              value={formState.valuation?.valuator || ''}
              onChange={(e) => handleNestedChange('valuation', 'valuator', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Name of individual or firm"
            />
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="valuationNotes" className="block text-sm font-medium text-gray-700 mb-2">
            Valuation Notes
          </label>
          <textarea
            id="valuationNotes"
            value={formState.valuation?.notes || ''}
            onChange={(e) => handleNestedChange('valuation', 'notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Provide details about how the valuation was determined, market conditions, assumptions made, etc."
          />
        </div>
      </div>

      {/* Value Range */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Value Range</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="minValue" className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Estimated Value (USD)
            </label>
            <input
              type="number"
              id="minValue"
              value={formState.valuation?.minValue || ''}
              onChange={(e) => handleNestedChange('valuation', 'minValue', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label htmlFor="maxValue" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Estimated Value (USD)
            </label>
            <input
              type="number"
              id="maxValue"
              value={formState.valuation?.maxValue || ''}
              onChange={(e) => handleNestedChange('valuation', 'maxValue', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Valuation Reports */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Supporting Valuation Reports</h3>
          <button
            onClick={addValuationReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Add Report
          </button>
        </div>

        {(formState.valuation?.valuationReports || []).length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">No valuation reports added</p>
            <p className="text-xs text-gray-500">Add supporting appraisal reports or expert opinions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(formState.valuation?.valuationReports || []).map((report) => (
              <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">Valuation Report</h4>
                  <button
                    onClick={() => removeValuationReport(report.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                    <select
                      value={report.type}
                      onChange={(e) => updateValuationReport(report.id, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="market-comparison">Market Comparison</option>
                      <option value="cost-approach">Cost Approach</option>
                      <option value="income-approach">Income Approach</option>
                      <option value="appraisal">Professional Appraisal</option>
                      <option value="expert-opinion">Expert Opinion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value (USD)</label>
                    <input
                      type="number"
                      value={report.value}
                      onChange={(e) => updateValuationReport(report.id, 'value', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={report.date}
                      onChange={(e) => updateValuationReport(report.id, 'date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valuator</label>
                    <input
                      type="text"
                      value={report.valuator}
                      onChange={(e) => updateValuationReport(report.id, 'valuator', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Name of valuator"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report URL</label>
                    <input
                      type="url"
                      value={report.reportUrl}
                      onChange={(e) => updateValuationReport(report.id, 'reportUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="https://example.com/report.pdf"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={report.notes}
                      onChange={(e) => updateValuationReport(report.id, 'notes', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      placeholder="Additional notes about this valuation report"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Valuation Guidelines</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Provide accurate and realistic valuations based on current market conditions</li>
          <li>• Include supporting documentation when available (appraisals, expert opinions)</li>
          <li>• Specify the valuation method used and any assumptions made</li>
          <li>• Consider factors that affect value: condition, rarity, market demand, provenance</li>
          <li>• Be transparent about the valuation date and valuator credentials</li>
        </ul>
      </div>
    </div>
  );
}

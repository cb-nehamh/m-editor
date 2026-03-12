import React from 'react';
import {
  Receipt, Repeat, FileText, FileSpreadsheet, CreditCard,
  Wallet, MapPin, UserCircle, BarChart3,
} from 'lucide-react';

export type FieldType = 'string' | 'number' | 'boolean' | 'select' | 'json' | 'multiselect';

export interface OptionField {
  key: string;
  label: string;
  type: FieldType;
  default?: any;
  options?: { value: string; label: string }[];
  group?: string;
  visibleWhen?: { variant?: string | string[] };
}

export interface FeatureToggle {
  key: string;
  label: string;
  default: boolean;
  visibleWhen?: { variant?: string | string[] };
}

export interface VariantDef {
  value: string;
  label: string;
}

export interface ClickActionDef {
  key: string;
  label: string;
  dataFields: { key: string; label: string }[];
}

export interface StandardActionOption {
  value: string;
  label: string;
  description: string;
}

export interface ButtonActionDef {
  key: string;
  label: string;
  standardActions: StandardActionOption[];
}

export interface ComponentDef {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'business';
  isContainer: boolean;
  regions?: string[];
  variants?: VariantDef[];
  options: OptionField[];
  features: FeatureToggle[];
  styleKeys: string[];
  clickActions?: ClickActionDef[];
  buttonActions?: ButtonActionDef[];
}

export const componentRegistry: ComponentDef[] = [
  {
    id: 'billingHistory',
    label: 'Billing History',
    description: 'Invoice table with filters, pagination, and actions',
    icon: React.createElement(Receipt, { size: 16 }),
    category: 'business',
    isContainer: false,
    variants: [
      { value: 'compact', label: 'Compact' },
      { value: 'standard', label: 'Standard' },
      { value: 'detailed', label: 'Detailed' },
    ],
    options: [
      {
        key: 'columns', label: 'Columns', type: 'multiselect',
        default: ['date', 'invoiceNumber', 'heroItem', 'totalAmount', 'status', 'view', 'download'],
        options: [
          { value: 'date', label: 'Date' },
          { value: 'invoiceNumber', label: 'Invoice #' },
          { value: 'billingPeriod', label: 'Billing Period' },
          { value: 'heroItem', label: 'Description' },
          { value: 'totalAmount', label: 'Amount' },
          { value: 'dueAmount', label: 'Due' },
          { value: 'status', label: 'Status' },
          { value: 'download', label: 'Download' },
          { value: 'view', label: 'View' },
        ],
      },
      { key: 'enableFiltering', label: 'Enable Filtering', type: 'boolean', default: true },
      { key: 'pageSize', label: 'Page Size', type: 'number', default: 10, group: 'Pagination' },
    ],
    features: [
      { key: 'showPayNow', label: 'Show Pay Now', default: true },
      { key: 'showDownload', label: 'Show Download', default: true },
      { key: 'showView', label: 'Show View', default: true },
      { key: 'showExpandableRows', label: 'Expandable Rows', default: false, visibleWhen: { variant: 'detailed' } },
      { key: 'showAccountSummary', label: 'Show Account Summary', default: true },
      { key: 'showPagination', label: 'Show Pagination', default: true },
    ],
    styleKeys: [
      'container', 'summaryCard', 'summaryTitle', 'summaryAmount', 'payNowButton',
      'filterBar', 'filterSelect', 'table', 'tableHeader', 'tableRow', 'tableRowHover',
      'tableCell', 'statusBadge', 'pagination', 'paginationButton', 'expandedRow',
      'emptyState', 'iconButton',
    ],
    clickActions: [
      { key: 'rowClick', label: 'Invoice Row Click', dataFields: [
        { key: 'invoiceId', label: 'Invoice ID' },
        { key: 'status', label: 'Status' },
        { key: 'amount', label: 'Amount' },
        { key: 'amountDue', label: 'Amount Due' },
        { key: 'currencyCode', label: 'Currency' },
      ]},
      { key: 'viewClick', label: 'View Invoice Click', dataFields: [
        { key: 'invoiceId', label: 'Invoice ID' },
      ]},
      { key: 'payNowClick', label: 'Pay Now Click', dataFields: [
        { key: 'customerId', label: 'Customer ID' },
        { key: 'totalDueAmount', label: 'Total Due' },
      ]},
    ],
    buttonActions: [
      { key: 'payNow', label: 'Pay Now', standardActions: [
        { value: 'collect_now', label: 'Open Payment Page', description: 'Opens Chargebee Collect Now hosted page' },
      ]},
      { key: 'download', label: 'Download Invoice', standardActions: [
        { value: 'download_pdf', label: 'Download PDF', description: 'Downloads invoice as PDF' },
      ]},
      { key: 'viewInvoice', label: 'View Invoice', standardActions: [] },
    ],
  },
  {
    id: 'subscriptionList',
    label: 'Subscription List',
    description: 'Subscription table with status filters and pagination',
    icon: React.createElement(Repeat, { size: 16 }),
    category: 'business',
    isContainer: false,
    variants: [
      { value: 'compact', label: 'Compact' },
      { value: 'standard', label: 'Standard' },
      { value: 'detailed', label: 'Detailed' },
    ],
    options: [
      {
        key: 'columns', label: 'Columns', type: 'multiselect',
        default: ['subscriptionId', 'planName', 'nextBillingCycle', 'invoiceDate', 'status'],
        options: [
          { value: 'subscriptionId', label: 'Subscription ID' },
          { value: 'planName', label: 'Plan Name' },
          { value: 'nextBillingCycle', label: 'Next Billing Cycle' },
          { value: 'invoiceDate', label: 'Invoice Date' },
          { value: 'status', label: 'Status' },
          { value: 'amount', label: 'Amount' },
          { value: 'currencyCode', label: 'Currency' },
          { value: 'createdAt', label: 'Created Date' },
          { value: 'startDate', label: 'Start Date' },
          { value: 'trialEndDate', label: 'Trial End' },
          { value: 'billingPeriod', label: 'Billing Period' },
          { value: 'paymentMethod', label: 'Payment Method' },
          { value: 'discount', label: 'Discount' },
          { value: 'autoRenew', label: 'Auto-Renew' },
          { value: 'cancelledAt', label: 'Cancelled Date' },
        ],
      },
      { key: 'enableFiltering', label: 'Enable Filtering', type: 'boolean', default: true },
      { key: 'pageSize', label: 'Page Size', type: 'number', default: 10 },
    ],
    features: [
      { key: 'showViewAction', label: 'Show View Action', default: true },
      { key: 'showPagination', label: 'Show Pagination', default: true },
    ],
    styleKeys: [
      'container', 'table', 'tableHeader', 'tableRow', 'tableRowHover',
      'tableCell', 'statusBadge', 'pagination', 'paginationButton',
      'emptyState', 'filterBar', 'filterSelect',
    ],
    clickActions: [
      { key: 'rowClick', label: 'Subscription Row Click', dataFields: [
        { key: 'subscriptionId', label: 'Subscription ID' },
        { key: 'planName', label: 'Plan Name' },
        { key: 'status', label: 'Status' },
        { key: 'planAmount', label: 'Plan Amount' },
        { key: 'currencyCode', label: 'Currency' },
      ]},
    ],
  },
  {
    id: 'subscriptionDetails',
    label: 'Subscription Details',
    description: 'Single subscription detail card with actions',
    icon: React.createElement(FileText, { size: 16 }),
    category: 'business',
    isContainer: false,
    variants: [],
    options: [
      { key: 'title', label: 'Title', type: 'string', default: 'Subscription Details' },
      { key: 'subscriptionId', label: 'Subscription ID', type: 'string', default: '' },
    ],
    features: [
      { key: 'showPauseResume', label: 'Show Pause/Resume', default: true },
      { key: 'showCancelRenew', label: 'Show Cancel/Renew', default: true },
      { key: 'showEdit', label: 'Show Edit', default: true },
      { key: 'showShippingAddress', label: 'Show Shipping Address', default: true },
      { key: 'showAddons', label: 'Show Add-ons', default: true },
      { key: 'showSwitchPlan', label: 'Show Switch Plan', default: false },
      { key: 'showProceedToPayment', label: 'Show Proceed to Payment', default: false },
      { key: 'showTrialBanner', label: 'Show Trial Banner', default: false },
    ],
    styleKeys: [
      'container', 'heading', 'headerCard', 'statusBadge', 'detailRow',
      'detailLabel', 'detailValue', 'sectionTitle', 'addonRow',
      'actionButton', 'dangerButton', 'editButton', 'buttonRow', 'shippingSection',
      'trialBanner', 'switchPlanButton', 'proceedToPaymentButton',
    ],
    clickActions: [
      { key: 'editClick', label: 'Edit Click', dataFields: [{ key: 'subscriptionId', label: 'Subscription ID' }] },
      { key: 'cancelClick', label: 'Cancel Click', dataFields: [{ key: 'subscriptionId', label: 'Subscription ID' }] },
      { key: 'pauseClick', label: 'Pause Click', dataFields: [{ key: 'subscriptionId', label: 'Subscription ID' }] },
      { key: 'resumeClick', label: 'Resume Click', dataFields: [{ key: 'subscriptionId', label: 'Subscription ID' }] },
    ],
    buttonActions: [
      { key: 'edit', label: 'Edit Subscription', standardActions: [
        { value: 'checkout_existing', label: 'Open Edit Page', description: 'Opens Chargebee subscription edit hosted page' },
      ]},
      { key: 'cancel', label: 'Cancel Subscription', standardActions: [
        { value: 'cancel_subscription', label: 'Cancel via API', description: 'Cancels subscription via Chargebee API' },
      ]},
      { key: 'pause', label: 'Pause Subscription', standardActions: [
        { value: 'pause_subscription', label: 'Pause via API', description: 'Pauses subscription via Chargebee API' },
      ]},
      { key: 'resume', label: 'Resume Subscription', standardActions: [
        { value: 'resume_subscription', label: 'Resume via API', description: 'Resumes subscription via Chargebee API' },
      ]},
      { key: 'switchPlan', label: 'Switch Plan', standardActions: [
        { value: 'checkout_existing', label: 'Open Plan Change Page', description: 'Opens Chargebee plan change hosted page' },
      ]},
      { key: 'proceedToPayment', label: 'Proceed to Payment', standardActions: [
        { value: 'collect_now', label: 'Open Payment Page', description: 'Opens Chargebee Collect Now hosted page' },
      ]},
    ],
  },
  {
    id: 'invoiceDetails',
    label: 'Invoice Details',
    description: 'Single invoice detail with line items and totals',
    icon: React.createElement(FileSpreadsheet, { size: 16 }),
    category: 'business',
    isContainer: false,
    variants: [],
    options: [
      { key: 'title', label: 'Title', type: 'string', default: 'Invoice Details' },
      { key: 'invoiceId', label: 'Invoice ID', type: 'string', default: '' },
    ],
    features: [
      { key: 'showDownload', label: 'Show Download', default: true },
      { key: 'showPayNow', label: 'Show Pay Now', default: true },
    ],
    styleKeys: [
      'container', 'heading', 'headerCard', 'headerLabel', 'headerValue',
      'statusBadge', 'fieldRow', 'fieldLabel', 'fieldValue',
      'lineItemsTable', 'lineItemHeader', 'lineItemRow', 'lineItemCell',
      'totalsSection', 'actionButton', 'payNowButton', 'buttonRow',
    ],
    clickActions: [
      { key: 'payNowClick', label: 'Pay Now Click', dataFields: [{ key: 'invoiceId', label: 'Invoice ID' }] },
    ],
    buttonActions: [
      { key: 'payNow', label: 'Pay Now', standardActions: [
        { value: 'collect_now', label: 'Open Payment Page', description: 'Opens Chargebee Collect Now hosted page' },
      ]},
      { key: 'download', label: 'Download PDF', standardActions: [
        { value: 'download_pdf', label: 'Download PDF', description: 'Downloads invoice as PDF' },
      ]},
    ],
  },
  {
    id: 'paymentMethodList',
    label: 'Payment Method List',
    description: 'List of saved payment methods with add/remove',
    icon: React.createElement(CreditCard, { size: 16 }),
    category: 'business',
    isContainer: false,
    variants: [],
    options: [
      { key: 'title', label: 'Title', type: 'string', default: 'Payment Methods' },
    ],
    features: [
      { key: 'showRemove', label: 'Show Remove', default: true },
      { key: 'allowRemoveDefault', label: 'Allow Remove Default', default: false },
      { key: 'showAddButton', label: 'Show Add Button', default: true },
      { key: 'showStatus', label: 'Show Status Badge', default: true },
    ],
    styleKeys: [
      'container', 'heading', 'list', 'item', 'itemIcon', 'itemLabel',
      'itemExpiry', 'statusBadge', 'primaryBadge', 'backupBadge',
      'removeButton', 'addButton', 'emptyState',
    ],
    clickActions: [
      { key: 'rowClick', label: 'Payment Method Click', dataFields: [
        { key: 'paymentSourceId', label: 'Payment Source ID' },
        { key: 'type', label: 'Type' },
        { key: 'last4', label: 'Last 4 Digits' },
        { key: 'brand', label: 'Brand' },
      ]},
    ],
    buttonActions: [
      { key: 'addPaymentMethod', label: 'Add Payment Method', standardActions: [
        { value: 'manage_payment_sources', label: 'Open Payment Management', description: 'Opens Chargebee manage payment sources hosted page' },
      ]},
      { key: 'removePaymentMethod', label: 'Remove Payment Method', standardActions: [
        { value: 'delete_payment_source', label: 'Delete via API', description: 'Deletes payment source via Chargebee API' },
      ]},
    ],
  },
  {
    id: 'paymentMethodDetails',
    label: 'Payment Method Details',
    description: 'Single payment method detail or add form',
    icon: React.createElement(Wallet, { size: 16 }),
    category: 'business',
    isContainer: false,
    variants: [],
    options: [
      {
        key: 'mode', label: 'Mode', type: 'select', default: 'view',
        options: [
          { value: 'view', label: 'View' },
          { value: 'add', label: 'Add' },
        ],
      },
      { key: 'title', label: 'Title', type: 'string', default: 'Payment Method Details' },
      { key: 'paymentSourceId', label: 'Payment Source ID', type: 'string', default: '' },
    ],
    features: [
      { key: 'showRemove', label: 'Show Remove', default: true },
    ],
    styleKeys: [
      'container', 'heading', 'detailCard', 'detailRow', 'detailLabel',
      'detailValue', 'statusBadge', 'actionButton', 'removeButton',
      'addFormContainer', 'addFormPlaceholder', 'saveButton', 'cancelButton', 'buttonRow',
    ],
    buttonActions: [
      { key: 'removePaymentMethod', label: 'Remove Payment Method', standardActions: [
        { value: 'delete_payment_source', label: 'Delete via API', description: 'Deletes payment source via Chargebee API' },
      ]},
    ],
  },
  {
    id: 'billingAddress',
    label: 'Billing Address',
    description: 'Address form with display/edit modes and field groups',
    icon: React.createElement(MapPin, { size: 16 }),
    category: 'business',
    isContainer: false,
    variants: [
      { value: 'compact', label: 'Compact' },
      { value: 'standard', label: 'Standard' },
      { value: 'stacked', label: 'Stacked' },
    ],
    options: [
      { key: 'requiredFields', label: 'Required Fields', type: 'json', default: [] },
    ],
    features: [
      { key: 'showEdit', label: 'Show Edit', default: true },
      { key: 'showSave', label: 'Show Save', default: true },
      { key: 'showCancel', label: 'Show Cancel', default: true },
    ],
    styleKeys: [
      'container', 'heading', 'editButton', 'fieldGrid', 'fieldGroup',
      'fieldLabel', 'fieldValue', 'sectionTitle', 'input', 'select',
      'checkbox', 'saveButton', 'cancelButton', 'actionRow', 'emptyState',
    ],
    buttonActions: [
      { key: 'save', label: 'Save Address', standardActions: [
        { value: 'update_billing_address', label: 'Update via API', description: 'Updates billing address via Chargebee API' },
      ]},
    ],
  },
  {
    id: 'accountDetails',
    label: 'Account Details',
    description: 'Customer account form with display/edit modes',
    icon: React.createElement(UserCircle, { size: 16 }),
    category: 'business',
    isContainer: false,
    variants: [
      { value: 'card', label: 'Card' },
      { value: 'list', label: 'List' },
    ],
    options: [
      { key: 'title', label: 'Title', type: 'string', default: '' },
      {
        key: 'sectionType', label: 'Section Type', type: 'select', default: 'accountInfo',
        options: [
          { value: 'accountInfo', label: 'Account Info' },
          { value: 'billingAddress', label: 'Billing Address' },
          { value: 'shippingAddress', label: 'Shipping Address' },
        ],
      },
      { key: 'editable', label: 'Editable', type: 'boolean', default: true },
      {
        key: 'layout', label: 'Form Layout', type: 'select', default: 'grid',
        options: [
          { value: 'grid', label: 'Grid (2-col)' },
          { value: 'vertical', label: 'Vertical (1-col)' },
        ],
      },
    ],
    features: [
      { key: 'showEdit', label: 'Show Edit Button', default: true },
    ],
    styleKeys: [],
    buttonActions: [
      { key: 'save', label: 'Save Account', standardActions: [
        { value: 'update_customer', label: 'Update via API', description: 'Updates customer details via Chargebee API' },
      ]},
    ],
  },
  {
    id: 'usage',
    label: 'Usage',
    description: 'Metered usage charts with granularity and item filters',
    icon: React.createElement(BarChart3, { size: 16 }),
    category: 'business',
    isContainer: false,
    variants: [
      { value: 'allInvoices', label: 'All Invoices' },
      { value: 'singleInvoice', label: 'Single Invoice' },
      { value: 'staticChart', label: 'Static Chart' },
    ],
    options: [
      {
        key: 'defaultChartType', label: 'Chart Type', type: 'select', default: 'line',
        options: [
          { value: 'line', label: 'Line' },
          { value: 'bar', label: 'Bar' },
          { value: 'area', label: 'Area' },
          { value: 'stackedBar', label: 'Stacked Bar' },
        ],
      },
      {
        key: 'defaultGranularity', label: 'Granularity', type: 'select', default: 'daily',
        options: [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' },
        ],
      },
      { key: 'invoiceId', label: 'Invoice ID', type: 'string', default: '', visibleWhen: { variant: ['singleInvoice', 'staticChart'] } },
      { key: 'subscriptionId', label: 'Subscription ID', type: 'string', default: '', visibleWhen: { variant: ['singleInvoice', 'staticChart'] } },
    ],
    features: [
      { key: 'showChartTypeSelector', label: 'Chart Type Selector', default: true, visibleWhen: { variant: ['allInvoices', 'singleInvoice'] } },
      { key: 'showGranularitySelector', label: 'Granularity Selector', default: true, visibleWhen: { variant: ['allInvoices', 'singleInvoice'] } },
      { key: 'showItemFilter', label: 'Item Filter', default: true, visibleWhen: { variant: ['allInvoices', 'singleInvoice'] } },
      { key: 'showDataTable', label: 'Data Table', default: false, visibleWhen: { variant: ['allInvoices', 'singleInvoice'] } },
      { key: 'showTotalSummary', label: 'Total Summary', default: true, visibleWhen: { variant: ['allInvoices', 'singleInvoice'] } },
      { key: 'showChart', label: 'Show Chart', default: true, visibleWhen: { variant: 'allInvoices' } },
      { key: 'showHeader', label: 'Show Header', default: true },
    ],
    styleKeys: [
      'container', 'heading', 'invoiceSelector', 'controlsBar', 'controlButton',
      'controlButtonActive', 'summaryRow', 'summaryCard', 'summaryLabel',
      'summaryValue', 'chartContainer', 'dataTable', 'tableHeader',
      'tableRow', 'tableCell', 'emptyState', 'itemCheckbox', 'sectionTitle',
    ],
    clickActions: [
      { key: 'invoiceChange', label: 'Invoice Selected', dataFields: [{ key: 'invoiceId', label: 'Invoice ID' }] },
    ],
  },
];

const sharedOptions: OptionField[] = [
  { key: 'defaultVisible', label: 'Visible by Default', type: 'boolean', default: true },
];

for (const def of componentRegistry) {
  def.options = [...def.options, ...sharedOptions];
}

export const registryMap = new Map<string, ComponentDef>(
  componentRegistry.map((c) => [c.id, c])
);

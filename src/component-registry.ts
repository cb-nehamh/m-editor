export type FieldType = 'string' | 'number' | 'boolean' | 'select' | 'json' | 'multiselect';

export interface OptionField {
  key: string;
  label: string;
  type: FieldType;
  default?: any;
  options?: { value: string; label: string }[];
  group?: string;
}

export interface FeatureToggle {
  key: string;
  label: string;
  default: boolean;
}

export interface VariantDef {
  value: string;
  label: string;
}

export interface ComponentDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: 'business';
  isContainer: boolean;
  regions?: string[];
  variants?: VariantDef[];
  options: OptionField[];
  features: FeatureToggle[];
  styleKeys: string[];
}

export const componentRegistry: ComponentDef[] = [
  {
    id: 'billingHistory',
    label: 'Billing History',
    description: 'Invoice table with filters, pagination, and actions',
    icon: '\uD83D\uDCCB',
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
    ],
    features: [
      { key: 'showPayNow', label: 'Show Pay Now', default: true },
      { key: 'showDownload', label: 'Show Download', default: true },
      { key: 'showView', label: 'Show View', default: true },
      { key: 'showExpandableRows', label: 'Expandable Rows', default: false },
    ],
    styleKeys: [
      'container', 'summaryCard', 'summaryTitle', 'summaryAmount', 'payNowButton',
      'filterBar', 'filterSelect', 'table', 'tableHeader', 'tableRow', 'tableRowHover',
      'tableCell', 'statusBadge', 'pagination', 'paginationButton', 'expandedRow',
      'emptyState', 'iconButton',
    ],
  },
  {
    id: 'subscriptionList',
    label: 'Subscription List',
    description: 'Subscription table with status filters and pagination',
    icon: '\uD83D\uDD04',
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
    ],
    styleKeys: [
      'container', 'table', 'tableHeader', 'tableRow', 'tableRowHover',
      'tableCell', 'statusBadge', 'pagination', 'paginationButton',
      'emptyState', 'filterBar', 'filterSelect',
    ],
  },
  {
    id: 'subscriptionDetails',
    label: 'Subscription Details',
    description: 'Single subscription detail card with actions',
    icon: '\uD83D\uDCC4',
    category: 'business',
    isContainer: false,
    variants: [],
    options: [
      { key: 'title', label: 'Title', type: 'string', default: 'Subscription Details' },
    ],
    features: [
      { key: 'showPauseResume', label: 'Show Pause/Resume', default: true },
      { key: 'showCancelRenew', label: 'Show Cancel/Renew', default: true },
      { key: 'showEdit', label: 'Show Edit', default: true },
      { key: 'showShippingAddress', label: 'Show Shipping Address', default: true },
    ],
    styleKeys: [
      'container', 'heading', 'headerCard', 'statusBadge', 'detailRow',
      'detailLabel', 'detailValue', 'sectionTitle', 'addonRow',
      'actionButton', 'dangerButton', 'editButton', 'buttonRow', 'shippingSection',
    ],
  },
  {
    id: 'invoiceDetails',
    label: 'Invoice Details',
    description: 'Single invoice detail with line items and totals',
    icon: '\uD83E\uDDFE',
    category: 'business',
    isContainer: false,
    variants: [],
    options: [
      { key: 'title', label: 'Title', type: 'string', default: 'Invoice Details' },
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
  },
  {
    id: 'paymentMethodList',
    label: 'Payment Method List',
    description: 'List of saved payment methods with add/remove',
    icon: '\uD83D\uDCB3',
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
    ],
    styleKeys: [
      'container', 'heading', 'list', 'item', 'itemIcon', 'itemLabel',
      'itemExpiry', 'statusBadge', 'primaryBadge', 'backupBadge',
      'removeButton', 'addButton', 'emptyState',
    ],
  },
  {
    id: 'paymentMethodDetails',
    label: 'Payment Method Details',
    description: 'Single payment method detail or add form',
    icon: '\uD83D\uDCB3',
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
    ],
    features: [
      { key: 'showRemove', label: 'Show Remove', default: true },
    ],
    styleKeys: [
      'container', 'heading', 'detailCard', 'detailRow', 'detailLabel',
      'detailValue', 'statusBadge', 'actionButton', 'removeButton',
      'addFormContainer', 'addFormPlaceholder', 'saveButton', 'cancelButton', 'buttonRow',
    ],
  },
  {
    id: 'billingAddress',
    label: 'Billing Address',
    description: 'Address form with display/edit modes and field groups',
    icon: '\uD83C\uDFE0',
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
  },
  {
    id: 'accountDetails',
    label: 'Account Details',
    description: 'Customer account form with display/edit modes',
    icon: '\uD83D\uDC64',
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
    features: [],
    styleKeys: [],
  },
  {
    id: 'usage',
    label: 'Usage',
    description: 'Metered usage charts with granularity and item filters',
    icon: '\uD83D\uDCCA',
    category: 'business',
    isContainer: false,
    variants: [
      { value: 'compact', label: 'Compact' },
      { value: 'standard', label: 'Standard' },
      { value: 'detailed', label: 'Detailed' },
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
    ],
    features: [
      { key: 'showChartTypeSelector', label: 'Chart Type Selector', default: true },
      { key: 'showGranularitySelector', label: 'Granularity Selector', default: true },
      { key: 'showItemFilter', label: 'Item Filter', default: true },
      { key: 'showDataTable', label: 'Data Table', default: false },
      { key: 'showTotalSummary', label: 'Total Summary', default: true },
    ],
    styleKeys: [
      'container', 'heading', 'invoiceSelector', 'controlsBar', 'controlButton',
      'controlButtonActive', 'summaryRow', 'summaryCard', 'summaryLabel',
      'summaryValue', 'chartContainer', 'dataTable', 'tableHeader',
      'tableRow', 'tableCell', 'emptyState', 'itemCheckbox', 'sectionTitle',
    ],
  },
];

export const registryMap = new Map<string, ComponentDef>(
  componentRegistry.map((c) => [c.id, c])
);

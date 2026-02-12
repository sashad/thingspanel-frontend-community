// Basic option types，for drop down selection、radio button group、Checkbox groups and other form items that require options
interface Option {
  label: string // The option text displayed to the user
  value: any // The value corresponding to the option
  children?: Option[] // For cascading selectors，Options may have sub-options
}

// Basic form item properties，Works with most form items
interface BasicProps {
  label?: string // The label of the form item
  placeholder?: string // Input box/Placeholder for selection box
  disabled?: boolean // Whether to disable form items
}

// Basic form item interface，All other form item types extend this interface
interface FormItemBase {
  type: string // Type of form item，like "Input", "Select"
  key: string // Unique key for form item，Used to generate the final form data object
  props?: BasicProps // Basic attribute object
}

// Autocomplete form items，Extend basic form items
interface AutoCompleteItem extends FormItemBase {
  type: 'AutoComplete'
  fetchSuggestions: (query: string) => Promise<Option[]> // Function to get autocomplete suggestions
}

// Selector form item，Support single selection and multiple selection
interface SelectItem extends FormItemBase {
  type: 'Select'
  options: Option[] // Selector options
  multiple?: boolean // Whether to support multiple selection
}

// Cascading selector form items
interface CascaderItem extends FormItemBase {
  type: 'Cascader'
  options: Option[] // Cascading options，Support nesting
}

// Checkbox form item
interface CheckboxItem extends FormItemBase {
  type: 'Checkbox'
  checked?: boolean // Whether the checkbox is selected
}

// Checkbox group form item
interface CheckboxGroupItem extends FormItemBase {
  type: 'CheckboxGroup'
  options: Option[] // Checkbox group options
}

// radio button form item
interface RadioItem extends FormItemBase {
  type: 'Radio'
  checked?: boolean // Whether the radio button is selected
}

// radio button group form item
interface RadioGroupItem extends FormItemBase {
  type: 'RadioGroup'
  options: Option[] // Options for radio button group
}

// Switch form item
interface SwitchItem extends FormItemBase {
  type: 'Switch'
  checked?: boolean // Is the switch on?
}

// Slider form item
interface SliderItem extends FormItemBase {
  type: 'Slider'
  value?: number // Slider current value
  min?: number // minimum value
  max?: number // maximum value
  step?: number // step size
}

// Date picker form item
interface DatePickerItem extends FormItemBase {
  type: 'DatePicker'
  value?: string // Selected date
}

// Time picker form item
interface TimePickerItem extends FormItemBase {
  type: 'TimePicker'
  value?: string // selected time
}

// Date time picker form item
interface DateTimePickerItem extends FormItemBase {
  type: 'DateTimePicker'
  value?: string // Selected date and time
}

// File upload form
interface UploadItem extends FormItemBase {
  type: 'Upload'
  fileList?: Array<{
    // List of uploaded files
    name: string // file name
    url: string // documentURL
  }>
}

// Dynamic tags（dynamic input）form item
interface DynamicTagsItem extends FormItemBase {
  type: 'DynamicTags'
  tags?: string[] // tag array
}

// Tree selector form item
interface TreeSelectItem extends FormItemBase {
  type: 'TreeSelect'
  treeData: Option[] // tree structured data，useOptiontype，Can containchildrenIndicates nesting
}

// Enter number form item
interface InputNumberItem extends FormItemBase {
  type: 'InputNumber'
  value?: number // current value
  min?: number // minimum value
  max?: number // maximum value
}

// Rating form item
interface RateItem extends FormItemBase {
  type: 'Rate'
  value?: number // Current rating value
}

// Shuttle box form item
interface TransferItem extends FormItemBase {
  type: 'Transfer'
  dataSource: Option[] // data source，Contains all options
  targetKeys: any[] // The data displayed in the right boxkeygather
}

// Color picker form item
interface ColorPickerItem extends FormItemBase {
  type: 'ColorPicker'
  value?: string // currently selected color value
}

// Verification rule interface，Define validation rules for form items
interface ValidationRule {
  required?: boolean // Is it required?
  message: string // Prompt message when verification fails
  validator?: (value: any) => boolean | Promise<boolean> // Custom verification function
}

// Form item interface，Aggregate all types of form items together
type FormItem =
  | AutoCompleteItem
  | SelectItem
  | CascaderItem
  | CheckboxItem
  | CheckboxGroupItem
  | RadioItem
  | RadioGroupItem
  | SwitchItem
  | SliderItem
  | DatePickerItem
  | TimePickerItem
  | DateTimePickerItem
  | UploadItem
  | DynamicTagsItem
  | TreeSelectItem
  | InputNumberItem
  | RateItem
  | TransferItem
  | ColorPickerItem

// formJSONstructure，描述整个form
interface FormJson {
  items: FormItem[] // Array of form items contained
}

import * as React from 'react';
import { isEmail as isEmailFn } from './isEmail';

export interface IReactMultiEmailProps {
  id?: string;
  // 不合法的邮箱地址会被过滤掉
  emails?: string[];
  onChange?: (emails: string[]) => void;
  enable?: ({ emailCnt }: { emailCnt: number }) => boolean;
  onDisabled?: () => void;
  onChangeInput?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (evt: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp?: (evt: React.KeyboardEvent<HTMLInputElement>) => void;
  noClass?: boolean;
  // 自定义邮箱验证规则
  // 这里应该不可以是一个异步函数
  validateEmail?: (email: string) => boolean | Promise<boolean>;
  enableSpinner?: boolean;
  style?: React.CSSProperties;
  getLabel: (
    email: string,
    index: number,
    removeEmail: (index: number, isDisabled?: boolean) => void,
  ) => React.ReactNode;
  className?: string;
  inputClassName?: string;
  // emails 为空并且 input 为空时显示的 placeholder
  placeholder?: string | React.ReactNode;
  autoFocus?: boolean;
  spinner?: () => React.ReactNode;
  delimiter?: string;
  initialInputValue?: string;
  autoComplete?: string;
  disableOnBlurValidation?: boolean;
  allowDisplayName?: boolean;
  stripDisplayName?: boolean;
  allowDuplicate?: boolean;
}


export function ReactMultiEmail(props: IReactMultiEmailProps) {
  const {
    id,
    style,
    className = '',
    noClass,
    placeholder,
    autoFocus,
    allowDisplayName = false,
    stripDisplayName = false,
    allowDuplicate = false,
    // delimiter分隔符 
    delimiter = `[${allowDisplayName ? '' : ' '},;]`,
    initialInputValue = '',
    inputClassName,
    autoComplete,
    getLabel,
    enable,
    onDisabled,
    validateEmail,
    onChange,
    onChangeInput,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    spinner,
    disableOnBlurValidation = false,
  } = props;
  const emailInputRef = React.useRef<HTMLInputElement>(null);

  const [focused, setFocused] = React.useState(false);
  const [emails, setEmails] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState(initialInputValue);
  const [spinning, setSpinning] = React.useState(false);

  const initialEmailAddress = (emails?: string[]) => {
    if (typeof emails === 'undefined') return [];
  
    const validEmails = emails.filter(email => validateEmail ? validateEmail(email) : isEmailFn(email));
    return validEmails;
  };

  const findEmailAddress = React.useCallback(
    // isEnter 表示是否是通过回车键触发的
    async (value: string, isEnter?: boolean) => {
      //
      const validEmails: string[] = [];
      let inputValue = '';
      // [ ,;] 表示匹配 空格、逗号、分号 中的任意一个
      const re = new RegExp(delimiter, 'g');
      const isEmail = validateEmail || isEmailFn;

      const addEmails = (email: string) => {
        if (!allowDuplicate) {
          for (let i = 0, l = emails.length; i < l; i++) {
            if (emails[i].toLowerCase() === email.toLowerCase()) {
              return false;
            }
          }
        }
        validEmails.push(email);
        return true;
      };

      if (value !== '') {
        if (re.test(value)) {
          // 感觉 Boolean 比 n => n 更好
          //! 当分隔符有多种形式的时候, 使用正则比较方便
          // code: '123,123,123;12312,3123'.split(/[ ,;]/g)
          // result: [ '123', '123', '123', '12312', '3123' ]
          const setArr = new Set(value.split(re).filter(Boolean));

          const arr = [...setArr];
          while (arr.length) {
            // 验证第一个 email
            const validateResult = isEmail('' + arr[0].trim());
            if (typeof validateResult === 'boolean') {
              if (validateResult) {
                // 将第一个 email 添加到 validEmails 中
                addEmails('' + arr.shift()?.trim());
              } else {
                //? 这里应该是输入另一种格式的 email
                if (allowDisplayName) {
                  const validateResultWithDisplayName = isEmail('' + arr[0].trim(), { allowDisplayName });
                  if (validateResultWithDisplayName) {
                    // Strip display name from email formatted as such "First Last <first.last@domain.com>"
                    const email = stripDisplayName ? arr.shift()?.split('<')[1].split('>')[0] : arr.shift();
                    addEmails('' + email);
                  } else {
                    if (arr.length === 1) {
                      inputValue = '' + arr.shift();
                    } else {
                      arr.shift();
                    }
                  }
                } else {
                  inputValue = '' + arr.shift();
                }
              }
            } else {
              // handle promise
              setSpinning(true);
              if ((await validateEmail?.(value)) === true) {
                addEmails('' + arr.shift());
                setSpinning(false);
              } else {
                if (arr.length === 1) {
                  inputValue = '' + arr.shift();
                } else {
                  arr.shift();
                }
              }
            }
          }
        } else {
          if (enable && !enable({ emailCnt: emails.length })) {
            onDisabled?.();
            return;
          }

          if (isEnter) {
            const validateResult = isEmail(value);

            if (typeof validateResult === 'boolean') {
              if (validateResult) {
                addEmails(value);
              } else if (allowDisplayName) {
                const validateResultWithDisplayName = isEmail(value, { allowDisplayName });
                if (validateResultWithDisplayName) {
                  // Strip display name from email formatted as such "First Last <first.last@domain.com>"
                  const email = stripDisplayName ? value.split('<')[1].split('>')[0] : value;
                  addEmails(email);
                } else {
                  inputValue = value;
                }
              } else {
                inputValue = value;
              }
            } else {
              // handle promise
              setSpinning(true);
              if ((await validateEmail?.(value)) === true) {
                addEmails(value);
                setSpinning(false);
              } else {
                inputValue = value;
              }
            }
          } else {
            inputValue = value;
          }
        }
      }

      // 更新视图 emails 和 inputValue
      // inputValue: 如果在上面逻辑中没有被赋值，那么它的值就是 ''
      setEmails([...emails, ...validEmails]);
      setInputValue(inputValue);

      if (validEmails.length) {
        onChange?.([...emails, ...validEmails]);
      }

      if (inputValue !== inputValue) {
        onChangeInput?.(inputValue);
      }
    },
    [
      allowDisplayName,
      allowDuplicate,
      delimiter,
      emails,
      enable,
      onChange,
      onChangeInput,
      onDisabled,
      stripDisplayName,
      validateEmail,
    ],
  );

  const onChangeInputValue = React.useCallback(
    async (value: string) => {
      await findEmailAddress(value);
      onChangeInput?.(value);
    },
    [findEmailAddress, onChangeInput],
  );

  const removeEmail = React.useCallback(
    (index: number, isDisabled?: boolean) => {
      if (isDisabled) {
        return;
      }
      // 删除 emails 中的第 index 个元素
      const _emails = [...emails.slice(0, index), ...emails.slice(index + 1)];
      setEmails(_emails);
      onChange?.(_emails);
    },
    [emails, onChange],
  );

  const handleOnKeydown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);

      switch (e.key) {
        case 'Enter':
          // 阻止默认行为，避免 form 提交
          e.preventDefault();
          break;
        case 'Backspace':
          // input 为空时，删除最后一个 email
          if (!e.currentTarget.value) {
            removeEmail(emails.length - 1, false);
          }
          break;
        default:
      }
    },
    [emails.length, onKeyDown, removeEmail],
  );

  const handleOnKeyup = React.useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyUp?.(e);

      switch (e.key) {
        case 'Enter':
          await findEmailAddress(e.currentTarget.value, true);
          break;
        default:
      }
    },
    [findEmailAddress, onKeyUp],
  );

  const handleOnChange = React.useCallback(
    async (e: React.SyntheticEvent<HTMLInputElement>) => await onChangeInputValue(e.currentTarget.value),
    [onChangeInputValue],
  );

  const handleOnBlur = React.useCallback(
    // 这里为什么不用 FocusEvent<HTMLInputElement, Element>
    async (e: React.SyntheticEvent<HTMLInputElement>) => {
      setFocused(false);
      // 如果 disableOnBlurValidation 为 true，那么不会触发 onBlur 验证
      if (!disableOnBlurValidation) {
        await findEmailAddress(e.currentTarget.value, true);
      }
      onBlur?.();
    },
    [disableOnBlurValidation, findEmailAddress, onBlur],
  );

  const handleOnFocus = React.useCallback(() => {
    setFocused(true);
    onFocus?.();
  }, [onFocus]);

  React.useEffect(() => {
    setEmails(initialEmailAddress(props.emails));
  }, [props.emails]);

  return (
    <div
      className={`${className} ${noClass ? '' : 'react-multi-email'} ${focused ? 'focused' : ''} ${
        // 通过 css 控制是否显示 placeholder
        inputValue === '' && emails.length === 0 ? 'empty' : 'fill'
      }`}
      style={style}
      onClick={() => emailInputRef.current?.focus()}
    >
      {spinning && spinner?.()}
      {placeholder ? <span data-placeholder>{placeholder}</span> : null}
      <div
        className={'data-labels'}
        // display: 'contents'; 表示元素本身不产生可视盒，它的子元素会表现得像它们的父元素直接一样
        // 可以理解成 React 中的 Fragment
        style={{ opacity: spinning ? 0.45 : 1.0, display: 'contents', flexWrap: 'inherit' }}
      >
        {emails.map((email: string, index: number) => getLabel(email, index, removeEmail))}
      </div>
      <input
        id={id}
        style={{ opacity: spinning ? 0.45 : 1.0 }}
        ref={emailInputRef}
        type='text'
        value={inputValue}
        autoFocus={autoFocus}
        className={inputClassName}
        autoComplete={autoComplete}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        onChange={handleOnChange}
        onKeyDown={handleOnKeydown}
        onKeyUp={handleOnKeyup}
      />
    </div>
  );
}

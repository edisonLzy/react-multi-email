import { cleanup, fireEvent, render } from '@testing-library/react';
import { ReactMultiEmail } from '../react-multi-email';
import React from 'react';

afterEach(cleanup);

function createReactMultiEmail(allowDuplicate?: boolean) {
  return (
    <ReactMultiEmail
      allowDuplicate={allowDuplicate}
      getLabel={(email, index, removeEmail) => {
        return (
          <div data-tag key={index}>
            <div data-tag-item>{email}</div>
            <span data-tag-handle onClick={() => removeEmail(index)}>
              ×
            </span>
          </div>
        );
      }}
    />
  );
}
it('allowDuplicate = true', async () => {
  const { getByRole } = render(createReactMultiEmail(true));
  const textbox = getByRole('textbox');

  const num = 3;
  for (let i = 0; i < num; i++) {
    fireEvent.change(textbox, { target: { value: `test@example.com` } });
    fireEvent.keyUp(textbox, { key: 'Enter', code: 'Enter' });
  }

  const emailsWrapper = document.querySelector('.data-labels');
  // childElementCount: The number of child elements of this element.
  expect(emailsWrapper?.childElementCount)?.toBe(num);
});

it('allowDuplicate = false', async () => {
  const { getByRole } = render(createReactMultiEmail(false));
  const textbox = getByRole('textbox');

  const num = 3;
  for (let i = 0; i < num; i++) {
    fireEvent.change(textbox, { target: { value: `test@example.com` } });
    fireEvent.keyUp(textbox, { key: 'Enter', code: 'Enter' });
  }

  const emailsWrapper = document.querySelector('.data-labels');
  expect(emailsWrapper?.childElementCount)?.toBe(1);
});

it('allowDuplicate = undefined', async () => {
  const { getByRole } = render(createReactMultiEmail());
  const textbox = getByRole('textbox');

  const num = 3;
  for (let i = 0; i < num; i++) {
    fireEvent.change(textbox, { target: { value: `test@example.com` } });
    fireEvent.keyUp(textbox, { key: 'Enter', code: 'Enter' });
  }

  const emailsWrapper = document.querySelector('.data-labels');
  expect(emailsWrapper?.childElementCount)?.toBe(1);
});

it('allowDuplicate = false, case sensitive', async () => {
  const { getByRole } = render(createReactMultiEmail(false));

  // 根据 accessibility role 获取元素, 这里获取到的就是input元素
  const textbox = getByRole('textbox');

  const num = 3;
  for (let i = 0; i < num; i++) {
    fireEvent.change(textbox, { target: { value: `test@example.com` } });
    fireEvent.keyUp(textbox, { key: 'Enter', code: 'Enter' });
  }

  fireEvent.change(textbox, { target: { value: `Test@example.com` } });
  fireEvent.keyUp(textbox, { key: 'Enter', code: 'Enter' });

  const emailsWrapper = document.querySelector('.data-labels');
  expect(emailsWrapper?.childElementCount)?.toBe(1);
});

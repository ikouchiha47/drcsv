import React, { useEffect, useRef, useState } from 'react';

export const ModalStates = Object.freeze({
  'OPEN': 'open',
  'CLOSE': 'close',
})

export const TextInputModal = ({
  title,
  placeholder,
  onSubmit,
  onModalClose,
  className,
  modalStyle,
  modalState,
}) => {
  // const [inputValue, setInputValue] = useState('');
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    console.log("modalState", modalState)

    if (modalState === ModalStates.OPEN) {
      dialogRef.current.showModal()
      return
    }

    dialogRef.current.close();

  }, [modalState])

  const handleApply = () => {
    onSubmit(inputRef.current && inputRef.current.value)
    onModalClose()
  };

  return (
    <div className={className} style={modalStyle}>
      <dialog ref={dialogRef}>
        <h2>{title}</h2>
        <input
          type="text"
          ref={inputRef}
          placeholder={placeholder}
        />
        <div style={{ marginTop: '10px' }}>
          <button onClick={handleApply}>Apply</button>
          <button onClick={onModalClose} style={{ marginLeft: '0.625rem' }}>
            Cancel
          </button>
        </div>
      </dialog>
    </div>
  );
};


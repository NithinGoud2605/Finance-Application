import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

const SignatureContext = createContext();

export const SignatureProvider = ({ children }) => {
  const signatureRef = useRef(null);
  const uploadSignatureRef = useRef(null);

  const [signatureData, setSignatureData] = useState('');
  const [typedSignature, setTypedSignature] = useState('');
  const [selectedFont, setSelectedFont] = useState({ name: 'Roboto', variable: 'Roboto' });
  const [typedSignatureFontSize] = useState(24);
  const [typedSignatureFonts] = useState([
    { name: 'Roboto', variable: 'Roboto' },
    { name: 'Open Sans', variable: 'Open+Sans' },
  ]);
  const [uploadSignatureImg, setUploadSignatureImg] = useState('');

  // Handle uploading a signature image
  const handleUploadSignatureChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.FileReader) {
      alert('FileReader API not supported in this browser.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUploadSignatureImg(reader.result);
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveUploadedSignature = useCallback(() => {
    setUploadSignatureImg('');
  }, []);

  // Clear the canvas-based signature
  const clearSignature = useCallback(() => {
    setSignatureData('');
    if (signatureRef.current && signatureRef.current.clear) {
      signatureRef.current.clear();
    }
  }, []);

  // When drawing ends, capture the canvas as a data URL
  const handleCanvasEnd = useCallback(() => {
    if (signatureRef.current && signatureRef.current.toDataURL) {
      setSignatureData(signatureRef.current.toDataURL());
    }
  }, []);

  // Clear typed signature
  const clearTypedSignature = useCallback(() => {
    setTypedSignature('');
  }, []);

  return (
    <SignatureContext.Provider
      value={{
        signatureRef,
        uploadSignatureRef,
        signatureData,
        setSignatureData,
        typedSignature,
        setTypedSignature,
        selectedFont,
        setSelectedFont,
        typedSignatureFontSize,
        typedSignatureFonts,
        uploadSignatureImg,
        setUploadSignatureImg,
        handleUploadSignatureChange,
        handleRemoveUploadedSignature,
        clearSignature,
        handleCanvasEnd,
        clearTypedSignature,
      }}
    >
      {children}
    </SignatureContext.Provider>
  );
};

export const useSignatureContext = () => useContext(SignatureContext);

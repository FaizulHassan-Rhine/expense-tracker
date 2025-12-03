import { useState, useCallback } from "react";

let toastId = 0;
const toasts = [];
const listeners = [];

export function useToast() {
  const [toastsState, setToastsState] = useState([]);

  const addToast = useCallback((toast) => {
    const id = ++toastId;
    const newToast = { ...toast, id };
    toasts.push(newToast);
    setToastsState([...toasts]);
    listeners.forEach((listener) => listener([...toasts]));

    if (toast.duration !== Infinity) {
      setTimeout(() => {
        dismiss(id);
      }, toast.duration || 5000);
    }

    return id;
  }, []);

  const dismiss = useCallback((id) => {
    const index = toasts.findIndex((t) => t.id === id);
    if (index > -1) {
      toasts.splice(index, 1);
      setToastsState([...toasts]);
      listeners.forEach((listener) => listener([...toasts]));
    }
  }, []);

  const toast = useCallback(
    (props) => {
      return addToast({
        ...props,
        variant: props.variant || "default",
      });
    },
    [addToast]
  );

  return {
    toast,
    dismiss,
    toasts: toastsState,
  };
}

export function toast(props) {
  const id = ++toastId;
  const newToast = { ...props, id };
  toasts.push(newToast);
  listeners.forEach((listener) => listener([...toasts]));

  if (props.duration !== Infinity) {
    setTimeout(() => {
      const index = toasts.findIndex((t) => t.id === id);
      if (index > -1) {
        toasts.splice(index, 1);
        listeners.forEach((listener) => listener([...toasts]));
      }
    }, props.duration || 5000);
  }

  return id;
}

// Subscribe function for Toast component
export function subscribeToToasts(callback) {
  listeners.push(callback);
  callback([...toasts]); // Initial call
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

// Dismiss function for external use
export function dismissToast(id) {
  const index = toasts.findIndex((t) => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    listeners.forEach((listener) => listener([...toasts]));
  }
}


import { Alert } from "react-native";

const showAlert = (title: string, message: string, onConfirm?: () => void, onCancel?: () => void) => {
  if (typeof window !== "undefined" && window.confirm) {
    // Web
    const confirmed = onConfirm ? window.confirm(`${title}\n\n${message}`) : window.alert(`${title}\n\n${message}`);
    if (confirmed && onConfirm) onConfirm();
    if (!confirmed && onCancel) onCancel();
  } else {
    // Native
    Alert.alert(title, message,
      onConfirm ? [
        { text: "No", style: "cancel", onPress: onCancel },
        { text: "Yes", style: "destructive", onPress: onConfirm },
      ] : [{ text: "OK" }]
    );
  }
};

export default showAlert;
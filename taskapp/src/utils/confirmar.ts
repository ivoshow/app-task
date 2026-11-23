// Diálogo de confirmação que funciona no celular E na web
// (Alert.alert com botões não funciona no navegador).
import { Alert, Platform } from "react-native"

export function confirmar(titulo: string, mensagem: string, textoConfirmar = "Confirmar"): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`))
  }
  return new Promise(resolve => {
    Alert.alert(titulo, mensagem, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: textoConfirmar, style: "destructive", onPress: () => resolve(true) }
    ], { cancelable: true, onDismiss: () => resolve(false) })
  })
}

export function avisar(titulo: string, mensagem: string) {
  if (Platform.OS === "web") window.alert(`${titulo}\n\n${mensagem}`)
  else Alert.alert(titulo, mensagem)
}

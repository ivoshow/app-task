// Armazenamento seguro da sessão.
// - Android/iOS: expo-secure-store (Keystore / Keychain, criptografado pelo sistema).
// - Web: localStorage (o SecureStore não existe na web; é menos seguro, use HTTPS em produção).
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

const isWeb = Platform.OS === "web"

export async function salvar(chave: string, valor: string) {
  if (isWeb) {
    localStorage.setItem(chave, valor)
    return
  }
  await SecureStore.setItemAsync(chave, valor)
}

export async function ler(chave: string): Promise<string | null> {
  if (isWeb) return localStorage.getItem(chave)
  return SecureStore.getItemAsync(chave)
}

export async function remover(chave: string) {
  if (isWeb) {
    localStorage.removeItem(chave)
    return
  }
  await SecureStore.deleteItemAsync(chave)
}

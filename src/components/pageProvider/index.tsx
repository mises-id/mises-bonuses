import { accountData } from "@/api";
import { createContext } from "@/utils/createContext";
interface pageValueProps {
  accountData: accountData | undefined
}
export const [usePageValue, PageValueProvider] = createContext<pageValueProps>("usePageValue")
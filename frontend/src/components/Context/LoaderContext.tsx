import {createContext, useMemo, useState} from 'react';
import {LoadingContextTypes, ReactChildren} from './ContextTypes';

const LoadingContext = createContext<LoadingContextTypes>({
	isLoading: false,
	changeIsLoadingState: () => {},
  setisLoadingTrue: () => {},
  setisLoadingFalse: () => {},
  loaderText: null,
  setLoaderText: () => {},
});
const LoadingProvider = ({children}: ReactChildren) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loaderText, setLoaderTextState] = useState<string | null>(null)

  const changeIsLoadingState = () => {
    setIsLoading(prevValue => !prevValue)
  }

  const setisLoadingFalse = () => {
    setLoaderTextState(null)
    setIsLoading(false)
  }

  const setisLoadingTrue = () => {
    setIsLoading(true)
  }

  const setLoaderText = (text: string) => {
    setLoaderTextState(text)
  }

  const value = useMemo(() => ({
      isLoading,
      changeIsLoadingState,
      setisLoadingTrue,
      setisLoadingFalse,
      loaderText,
      setLoaderText,
  }), [isLoading, loaderText])

	return (
		<LoadingContext.Provider
			value={value}
		>
			{children}
		</LoadingContext.Provider>
	);
};

export {LoadingContext, LoadingProvider};

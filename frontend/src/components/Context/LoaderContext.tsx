import {createContext, useState} from 'react';
import {LoadingContextTypes, ReactChildren} from './ContextTypes';

const LoadingContext = createContext<LoadingContextTypes>({
	isLoading: false,
	changeIsLoadingState: () => {},
});
const LoadingProvider = ({children}: ReactChildren) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);

  const changeIsLoadingState = () => {
    setIsLoading(prevValue => !prevValue)
  }

	return (
		<LoadingContext.Provider
			value={{
				isLoading,
				changeIsLoadingState,
			}}
		>
			{children}
		</LoadingContext.Provider>
	);
};

export {LoadingContext, LoadingProvider};

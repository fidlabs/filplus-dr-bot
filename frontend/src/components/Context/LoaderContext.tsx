import React, {createContext, useState} from 'react';
import {LoadingContextTypes, ReactChildren} from './ContextTypes';

const LoadingContext = createContext<LoadingContextTypes>({
	isLoading: false,
	changeIsLoadingState: () => {},
  setisLoadingTrue: () => {},
  setisLoadingFalse: () => {},
});
const LoadingProvider = ({children}: ReactChildren) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);

  const changeIsLoadingState = () => {
    setIsLoading(prevValue => !prevValue)
  }

  const setisLoadingFalse = () => {
    setIsLoading(false)
  }

  const setisLoadingTrue = () => {
    setIsLoading(true)
  }

	return (
		<LoadingContext.Provider
			value={{
				isLoading,
				changeIsLoadingState,
        setisLoadingTrue,
        setisLoadingFalse
			}}
		>
			{children}
		</LoadingContext.Provider>
	);
};

export {LoadingContext, LoadingProvider};

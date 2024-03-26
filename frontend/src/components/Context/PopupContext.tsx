import React, {createContext, useState, ReactNode, useCallback, useMemo} from 'react';
import {Dialog, Box, Typography, IconButton} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface PopupContextType {
	showPopup: (content: ReactNode, title: string) => void;
	hidePopup: () => void;
	isPopupVisible: boolean;
	popupContent: ReactNode | null;
}

const PopupContext = createContext<PopupContextType>({
	showPopup: () => {},
	hidePopup: () => {},
	isPopupVisible: false,
	popupContent: 'Default Content',
});

interface PopupProviderProps {
	children: ReactNode;
}

const PopupProvider: React.FC<PopupProviderProps> = ({children}) => {
	const [popupContent, setPopupContent] = useState<ReactNode | null>(null);
	const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false);
	const [popupTitle, setPopupTitle] = useState<string>('Default Title');

	const showPopup = useCallback((content: ReactNode, title: string) => {
		setPopupContent(content);
		setPopupTitle(title);
		setIsPopupVisible(true);
	}, []);

	const hidePopup = useCallback(() => {
		setPopupContent(null);
		setIsPopupVisible(false);
	}, []);

	const contextValue = useMemo(
		() => ({
			showPopup,
			hidePopup,
			isPopupVisible,
			popupContent,
		}),
		[hidePopup, isPopupVisible, popupContent, showPopup],
	);

	return (
		<PopupContext.Provider
			value={contextValue}
		>
			{children}
			<Dialog
				open={isPopupVisible}
				onClose={hidePopup}
				aria-labelledby="popup-title"
				fullWidth
				maxWidth="sm"
			>
				<Box p={2} minHeight={200} position="relative">
					<IconButton
						aria-label="close"
						onClick={hidePopup}
						sx={{
							position: 'absolute',
							top: 0,
							right: 0,
							color: 'inherit', // inherit color from the parent
						}}
					>
						<CloseIcon />
					</IconButton>
					<Typography
						variant="h4"
						gutterBottom
						sx={{
							textAlign: 'center',
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'center',
							marginBottom: '50px',
						}}
					>
						{popupTitle}
					</Typography>
					{popupContent}
				</Box>
			</Dialog>
		</PopupContext.Provider>
	);
};

export {PopupContext, PopupProvider};

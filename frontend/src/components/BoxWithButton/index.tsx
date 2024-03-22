import React, {ReactNode} from 'react';
import { Box } from '@mui/material';

type Props = {
	children: ReactNode;
  onClick: () => void;
}

function BoxWithButton({children, onClick} : Props) {
	return (
		<Box
			onClick={onClick}
			className="container"
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				width: 400,
				height: 400,
				border: '2px solid #1976d2',
				color: '#1976d2',
				transition: 'background-color 0.3s',
				'&:hover': {
					backgroundColor: '#1976d2',
					color: 'white',
				},
				cursor: 'pointer',
			}}
		>
			{children}
		</Box>
	);
}

export default BoxWithButton

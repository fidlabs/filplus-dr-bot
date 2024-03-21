import CircularProgress from '@mui/material/CircularProgress';
import { useContext } from 'react';
import { LoadingContext } from '../Context/LoaderContext';

const Loader = () => {
  const {isLoading} = useContext(LoadingContext)
	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
        zIndex: 10000,
				width: '100%',
				height: '100%',
				backgroundColor: 'rgba(0, 0, 0, 0.7)',
				display: isLoading ? 'flex' : 'none',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<CircularProgress size={100} color="primary" />
		</div>
	);
};

export default Loader;

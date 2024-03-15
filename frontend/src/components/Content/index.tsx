import { IconButton, Typography } from "@mui/material";
import BoxWithButton from "../BoxWithButton";
import RootList from "../RootList";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useState } from "react";

enum ListState {
	ROOT = 'root',
}

function Content() {
	const [listState, setListState] = useState<ListState | null>(null);
	return (
		<>
			{!listState && (
				<>
					{/* <BoxWithButton onClick={() => setListState(ListState.NOTARY)}>
						Choose Notary List
					</BoxWithButton> */}
					<BoxWithButton onClick={() => setListState(ListState.ROOT)}>
						Choose Root Key Holder List
					</BoxWithButton>
				</>
			)}
			{listState && (
				<div>
					<IconButton onClick={() => setListState(null)} color="inherit" aria-label="back">
						<ArrowBackIcon />
						<Typography variant="button">Back</Typography>
					</IconButton>
					{/* {listState === ListState.NOTARY && <NotaryList />} */}
					{listState === ListState.ROOT && <RootList />}
				</div>
			)}
		</>
	);
}

export default Content


import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { useContext } from 'react';
import { DeviceContext } from '../Context/DeviceContext';



const SelectAccount = () => {
  const {accounts, currentAccount, changeAccount} = useContext(DeviceContext);

  if(!accounts) return

  const handleChange = (event: SelectChangeEvent<string>) => {
    const account = event.target.value;
    const index = accounts.indexOf(account); // Get the index of the selected account
    changeAccount(account, index);
  };
  return (
    <FormControl variant="outlined" style={{ minWidth: 200 }}>
      <InputLabel id="demo-simple-select-outlined-label">Select Account</InputLabel>
      <Select
        labelId="demo-simple-select-outlined-label"
        id="demo-simple-select-outlined"
        value={currentAccount || ''}
        onChange={handleChange}
        label="Select Account"
      >
        {accounts.map((account) => (
          <MenuItem key={account} value={account}>
            {account}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SelectAccount;
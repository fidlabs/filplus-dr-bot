import { createContext, useState, ReactNode } from 'react';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import { FilecoinApp } from "@zondax/ledger-filecoin";

interface DeviceContextType {
  ledgerApp: FilecoinApp | null;
  loadLedgerData: () => void; // Function to trigger data loading
}

const DeviceContext = createContext<DeviceContextType>({ 
  ledgerApp: null, 
  loadLedgerData: () => {} // Default empty function
});

interface DeviceProviderProps {
  children: ReactNode;
}

const DeviceProvider = ({ children }: DeviceProviderProps) => {
  const [ledgerApp, setLedgerApp] = useState<FilecoinApp | null>(null);

  const loadLedgerData = async () => {
    try {
      const transport = await TransportWebUSB.create();
      const app = new FilecoinApp(transport);
      setLedgerApp(app);
    } catch (error) {
      console.error('Error loading data from Ledger device:', error);
    }
  };

  return (
    <DeviceContext.Provider value={{ ledgerApp, loadLedgerData }}>
      {children}
    </DeviceContext.Provider>
  );
};

export { DeviceContext, DeviceProvider };
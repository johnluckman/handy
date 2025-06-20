interface DenominationData {
  [id: string]: RowData;
}

// Add 'owed' to the RowData interface
export interface RowData {
  actualCount: number;
  targetFloat: number;
  borrow: number;
  returned: number;
  owed: number; // This will hold the value from the "Safe" sheet
}

// Function to initialize the state from our denominations config
const initializeState = (): DenominationData => {
  const initialState: DenominationData = {};
  denominations.forEach(d => {
    initialState[d.id] = {
      actualCount: 0,
      targetFloat: d.targetCount,
      borrow: d.targetCount,
      returned: 0,
      owed: 0, // Initialize with 0
    };
  });
  return initialState;
};

const handleSubmit = async () => {
  setIsLoading(true);
  const date = new Date().toISOString();

  const flatData = denominations.flatMap(d => {
    const row = data[d.id];
    return [row.actualCount, row.targetFloat, row.borrow, row.returned];
  });

  const rowData = [ date, userName, notes, total, ...flatData ];

  try {
    const result = await appendToSheet(rowData);
    if (result && result.data && result.data.success && result.data.owedData) {
      Alert.alert('Success', 'Cash count successfully submitted!');
      
      // Update the state with the new "Owed" values from the sheet
      const newOwedData = result.data.owedData;
      setData(prevData => {
        const updatedData = { ...prevData };
        for (const id in newOwedData) {
          if (updatedData[id]) {
            updatedData[id].owed = newOwedData[id];
          }
        }
        return updatedData;
      });

    } else {
      throw new Error(result.message || 'Submission failed. Please check the logs.');
    }
  } catch (error: any) {
    // ... existing code ...
    // ... existing code ...
    <View style={styles.inputGroup}>
     <Text style={styles.label}>Owed</Text>
     <TextInput
       style={[styles.input, styles.readOnlyInput]}
       value={rowData.owed.toString()}
       editable={false}
     />
   </View>

    {/* Returned */}
    // ... existing code ...
  }
}; 
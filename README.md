# ccsv

## Calculated csv files

Create simple table calculation without Microsoft Excel or Libreoffice Calc.

Just create a simple text file with a ccsv ending, and compile it using:

```
node ./ccsv.js <your ccsv file>
```

This will output the resolved table directly in the commandline. If you want to save this to a csv file, just use standard linux output to file syntax:

```
node ./ccsv.js transactions.ccsv > transactions_calculated.csv
```

---

## Example

| input file                                                                                                                  | output                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| <pre lang="csv">transactions<br/>100<br/>-9<br/>-5<br/>-20<br/>-30<br/>-10<br/>-5<br/>---<br/>=sum(transactions)<br/></pre> | <pre lang="csv">transactions<br/>100<br/>-9<br/>-5<br/>-20<br/>-30<br/>-10<br/>-5<br/>---<br/>21<br/></pre> |


const alphabets = [...Array(26).keys()].map((n) => String.fromCharCode(97 + n));
var headers = [];
const dataValues = Array(100).fill().map(() => Array(100));
var rowSelected;
var columnSelected;

// function to get the headers: A, B.....,CU, CV
function getHeaderValue(val) {
	let value = alphabets[val % 26];
	if (val / 25 > 1) {
		value = alphabets[Math.trunc(val / 26) - 1] + '' + value;
	}
	headers.push(value.toUpperCase());
	return value.toUpperCase();
}


function isAFormula(val) {
	return val && val.startsWith("=");
}

// convert formulas to the value of the cell for example A1 = 22
function getBasicFormula(val) {
	let tempFormula = val.replace(/[+\-*\/]/g, '#').replace('=', '#');
	let newFormula = val;
	let data = tempFormula.split('#');
	data.forEach(element => {
		// remove text giving us the row
		const row = element.replace(/[^0-9\.]+/g, "");
		// remove number to get the column
		const column = element.replace(/[0-9]/g, '');

		const headerIndex = headers.indexOf(column.toUpperCase());
		// if the Cell exist then add to the formula
		if (headerIndex > -1) {
			var contenteditable = document.getElementById('cell_' + row + '_' + (headerIndex + 1));
			if (contenteditable && contenteditable.innerHTML) {
				let tempForm = newFormula.replace(element, contenteditable.innerHTML);
				newFormula = tempForm;
			}
		}
	});
	return newFormula;
}

function isAFunction(val) {
	if (val.toLowerCase().startsWith('=sum')
		|| val.toLowerCase().startsWith('=avg') || val.toLowerCase().startsWith('=count')) {
		return true
	}
	return false;
}


// sometimes our text contains html as sting for example <br/>
function removeTags(str) {
	if ((str === null) || (str === ''))
		return false;
	else
		str = str.toString();
	return str.replace(/(<([^>]+)>)/ig, '');
}


//example of function =sum(A1:A20) or =sum(A1:A20,B1,C1,5)
function processFunctions(val) {
	let tempFormula = val.substring(val.indexOf('(') + 1, val.indexOf(')'));
	let items = 0;
	let sum = 0;
	const totalValues = tempFormula.split(',');
	totalValues.forEach(tempValue => {
		const rangeArray = tempValue.split(':');
		if (rangeArray.length > 1) {
			
			const rowStart = rangeArray[0].replace(/[^0-9\.]+/g, "");
			const rowEnd = rangeArray[1].replace(/[^0-9\.]+/g, "");
			const columnStart = rangeArray[0].replace(/[0-9]/g, '');
			const headerIndexStart = headers.indexOf(columnStart.toUpperCase()) + 1;
			const columnEnd = rangeArray[1].replace(/[0-9]/g, '');
			const headerIndexEnd = headers.indexOf(columnEnd.toUpperCase()) + 1;
			// if we find the start and end column
			if (headerIndexStart > -1 && headerIndexEnd > -1 ) {
				// go through all the cells and sum up
				for (let row = rowStart; row <= rowEnd; row++) {
					for (let column = headerIndexStart; column <= headerIndexEnd; column++) {
						var contenteditable = document.getElementById('cell_' + row + '_' + column);
						if (contenteditable) {
							sum += Number(contenteditable.innerHTML) || 0;
							items++;
						}
					}		
				}
			}
			
		} else {
			let regExp = /[a-z]/i;
			//if the value is a cell reference
			if (rangeArray.length > 0 && regExp.test(rangeArray[0].toLowerCase())) {
				const contenteditable = getCellFromExpression(rangeArray[0]);
				if (contenteditable && contenteditable.innerHTML) {
					sum+= Number(contenteditable.innerHTML) || 0;
				}
				items++;
			} else {
				// if the value is a number then just sum up
				sum += Number(rangeArray[0]) || 0;
				items++;
			}
		}
	});
	if (val.toLowerCase().startsWith('=sum')) return sum;
	if (val.toLowerCase().startsWith('=avg')) return sum / items;
	if (val.toLowerCase().startsWith('=count')) return items;
	return sum;
}

function getCellFromExpression(text){
	// remove text giving us the row
	const row = text.replace(/[^0-9\.]+/g, "");
	// remove number to get the column
	const column = text.replace(/[0-9]/g, '');
	const headerIndex = headers.indexOf(column.toUpperCase());
	if (headerIndex > -1) {
		var contenteditable = document.getElementById('cell_' + row + '_' + (headerIndex + 1));
		return contenteditable;
	}
	return null;
}
function onClickCell(i, j) {
	rowSelected = i;
	columnSelected = j;
	var contenteditable = document.getElementById('cell_' + i + '_' + j);
	text = contenteditable.innerHTML;
	if (isAFormula(dataValues[i][j])) {
		contenteditable.innerHTML = dataValues[i][j];
	}
}

function onCellEdited(row, column) {
	var cellEditable = document.getElementById('cell_' + row + '_' + column);
	text = removeTags(cellEditable.innerHTML);
	dataValues[row][column] = removeTags(text);
	if (isAFormula(text)) {
		if (isAFunction(text)) {
			cellEditable.innerHTML = processFunctions(text);
		} else {
			const newVal = getBasicFormula(text);
			let regExp = /[a-z]/i;
			if (regExp.test(newVal.toLowerCase())) {
				cellEditable.innerHTML = 'Syntax Error';
			} else {
				const result = eval(newVal.replace('=', ''));
				cellEditable.innerHTML = result;
			}
		}
	}
	checkForCellsToUpdate(row, column);
}


// update the value of the referred cells
function getNewValue(cellEditable, row, column) {
	let text = dataValues[row][column];
	if (isAFunction(text)) {
		cellEditable.innerHTML = processFunctions(text);
	} else {
		const newVal = getBasicFormula(text);
	
		let regExp = /[a-z]/i;
		if (regExp.test(newVal.toLowerCase())) {
			cellEditable.innerHTML = 'Syntax Error';
		} else {
			const result = eval(newVal.replace('=', ''));
			cellEditable.innerHTML = result;
		}
	}
}
// function to refresh cells with formulas related to the updated cell
function checkForCellsToUpdate(row, column) {
	for (let i = 1; i < 100; i++) {

		//check if the formula is somewhere in the grid
		let valuesArray = dataValues[i].filter(x => x && x.toUpperCase().includes(headers[column - 1] + '' + row));
		valuesArray.forEach(element => {
			const indexColumn = dataValues[i].indexOf(element);
			var cellEditable = document.getElementById('cell_' + i + '_' + indexColumn);
			if (cellEditable) {
				getNewValue(cellEditable, i, indexColumn);
			};
		});
	}
}

function resetData() {
	for (let i = 1; i < 100; i++) {
		for (let j = 1; j < 100; j++) {
			var cellValue = document.getElementById('cell_' + i + '_' + j);
			if (cellValue) {
				cellValue.innerHTML = '';
			}
			dataValues[i][j] = '';
		}
	}
}


// Step 7. Bold
function makeItBold() {
	var cellEditable = document.getElementById('cell_' + rowSelected + '_' + columnSelected);
	if (cellEditable.style.fontWeight === '900') {
		cellEditable.style.fontWeight = '300'
	} else {
		cellEditable.style.fontWeight = '900'
	}
}

// Step 7. Italic
function makeItItalic() {
	var cellEditable = document.getElementById('cell_' + rowSelected + '_' + columnSelected);
	if (cellEditable.style.fontStyle === 'normal') {
		cellEditable.style.fontStyle = 'italic'
	} else {
		cellEditable.style.fontStyle = 'normal'
	}
}

// Step 7. Underline
function addUnderline() {
	var cellEditable = document.getElementById('cell_' + rowSelected + '_' + columnSelected);
	if (cellEditable.style.textDecoration === 'underline') {
		cellEditable.style.textDecoration = 'none'
	} else {
		cellEditable.style.textDecoration = 'underline'
	}
}

// Create the initial table
function tableCreate() {
	let body = document.getElementsByTagName('body')[0];

	let tbl = document.createElement('table');
	tbl.setAttribute('border', '1');
	let tbdy = document.createElement('tbody');
	for (let i = 0; i <= 100; i++) {
		let tr = document.createElement('tr');

		for (let j = 0; j <= 100; j++) {
			let td = document.createElement('td');
			// 
			tr.appendChild(td);
			// first column is the numbers column
			if (j === 0) {
				td.className = 'voidCell';
			}
			if (j === 0 && i > 0) {
				td.appendChild(document.createTextNode(i));
			} else if (j > 0 && i === 0) {
				td.appendChild(document.createTextNode(getHeaderValue(j - 1)));
			} else {
				td.contentEditable = true;
			}
			td.id = 'cell_' + i + '_' + j;
			// tbdy.on
			td.setAttribute('onclick', 'onClickCell(' + i + ',' + j + ');')
			// td.setAttribute('onkeydown', 'onCellEdited('+i+','+j+');')
			td.setAttribute('onblur', 'onCellEdited(' + i + ',' + j + ');')
		}
		tbdy.appendChild(tr);
	}
	tbl.appendChild(tbdy);
	body.appendChild(tbl)
}

tableCreate();
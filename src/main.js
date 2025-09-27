// Dropdown DOM Elements
let dropdown = document.querySelector('.dropdown')
let grid = document.querySelector('.grid')
let size = document.querySelector('.size')

// Preview DOM Elements
let editor = document.querySelector('.editor textarea')
let preview = document.querySelector('.preview')

// Toolbar DOM Elements
let alignLeft = document.querySelector('.align-left')
let alignCenter = document.querySelector('.align-center')
let alignRight = document.querySelector('.align-right')

// Table State Variables
let rowsHighest = 6
let columnsHighest = 6
let rowsUsed = 0
let columnsUsed = 0

// Currently Selected
let altSelected = null

// Table Arrays
let tableArray = []
let alignments = []

document.addEventListener('DOMContentLoaded', function() {
  setupClickHandler()
  setupDropdownHandler()
})

// GLOBAL EVENT DELEGATION
function setupClickHandler() {
  document.addEventListener('click', function(e) {
    // Dropdown Event Listeners
    if (!e.target.closest('.hamburger') && !e.target.closest('.dropdown')) {
      dropdown.classList.remove('open')
    }
    if (e.target.closest('.hamburger')) {
      dropdown.classList.toggle('open')
      return
    }
    
    // Textarea Event Listeners
    let copy = e.target.closest('.copy')
    if (copy) {
      if (editor.value.trim() === '') { return }
      copyToClipboard(editor.value)
      
      let original = copy.innerText;
      copy.innerText = 'Copied!'
      setTimeout(function() {
        copy.innerText = original
      }, 1500)
      return
    }
    
    // Toolbar Event Listeners
    if (e.target.closest('.align-left')) {
      alignTableMarkdown('left')
      return
    }
    if (e.target.closest('.align-center')) {
      alignTableMarkdown('center')
      return
    }
    if (e.target.closest('.align-right')) {
      alignTableMarkdown('right')
      return
    }
  })
}

// TEXTAREA HELPER FUNCTIONS
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
      .then(function() {
        return true
      })
      .catch(function(e) {
        return fallbackCopyToClipboard(text)
      })
  } else {
    return Promise.resolve(fallbackCopyToClipboard(text))
  }
}

function fallbackCopyToClipboard(text) {
  let textarea = document.createElement("textarea")
  textarea.value = text
  textarea.style.position = "fixed"
  textarea.style.opacity = 0
  
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  
  try {
    let successful = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (successful) {
      return true
    } else {
      return false
    }
  } catch (e) {
    document.body.removeChild(textarea)
    return false
  }
}

function updateTableMarkdown() {
  let markdown = formatTableMarkdown()
  editor.value = markdown
}

function formatTableMarkdown() {
  if (rowsUsed === 0 || columnsUsed === 0) { return '' }
  
  let columnWidths = calculateColumnWidths()
  let markdown = ''
  
  markdown = markdown + '|'
  for (let i = 0; i < columnsUsed; i++) {
    let content = tableArray[0][i] || ''
    let padding = columnWidths[i] - content.length
    
    if (alignments[i] === 'center') {
      let leftPadding = Math.floor(padding / 2)
      let rightPadding = padding - leftPadding
      
      markdown = markdown + ` ${' '.repeat(leftPadding)}${content}${' '.repeat(rightPadding)} |`
    } else if (alignments[i] === 'right') {
      markdown = markdown + ` ${' '.repeat(padding)}${content} |`
    } else {
      markdown = markdown + ` ${content}${' '.repeat(padding)} |`
    }
  }
  markdown = markdown + '\n'
  
  markdown = markdown + '|'
  for (let i = 0; i < columnsUsed; i++) {
    let alignment = alignments[i] || 'left'
    let width = columnWidths[i]
    
    if (alignment === 'center') {
      markdown = markdown + ` :${'-'.repeat(Math.max(width - 2, 0))}: |`
    } else if (alignment === 'right') {
      markdown = markdown + ` ${'-'.repeat(Math.max(width - 1, 0))}: |`
    } else {
      markdown = markdown + ` :${'-'.repeat(Math.max(width - 1, 0))} |`
    }
  }
  markdown = markdown + '\n'
  
  for (let r = 1; r < tableArray.length; r++) {
    markdown = markdown + '|'
    for (let i = 0; i < columnsUsed; i++) {
      let content = tableArray[r][i] || ''
      let padding = columnWidths[i] - content.length
      
      if (alignments[i] === 'center') {
        let leftPadding = Math.floor(padding / 2)
        let rightPadding = padding - leftPadding
        markdown = markdown + ` ${' '.repeat(leftPadding)}${content}${' '.repeat(rightPadding)} |`
      } else if (alignments[i] === 'right') {
        markdown = markdown + ` ${' '.repeat(padding)}${content} |`
      } else {
        markdown = markdown + ` ${content}${' '.repeat(padding)} |`
      }
    }
    markdown = markdown + '\n'
  }
  
  return markdown
}

function calculateColumnWidths() {
  let columnWidths = []
  
  for (let i = 0; i < columnsUsed; i++) {
    let maxWidth = 0;
    for (let r = 0; r < tableArray.length; r++) {
      let content = tableArray[r][i] || ''
      maxWidth = Math.max(maxWidth, content.length)
    }
    columnWidths.push(maxWidth)
  }
  
  return columnWidths
}


// TOOLBAR HELPER FUNCTIONS
function alignTableMarkdown(alignment) {
  if (!altSelected) { return }
  let i = parseInt(altSelected.dataset.col)
  alignments[i] = alignment
  updateToolbarState(alignment)
  generateTable()
}

function updateToolbarState(alignment) {
  alignLeft.classList.remove('active')
  alignCenter.classList.remove('active')
  alignRight.classList.remove('active')
  
  if (alignment === 'left') {
    alignLeft.classList.add('active')
  } else if (alignment === 'center') {
    alignCenter.classList.add('active')
  } else if (alignment === 'right') {
    alignRight.classList.add('active')
  }
}

// PREVIEW HELPER FUNCTIONS
function updateTablePreview() {
  if (rowsUsed === 0 || columnsUsed === 0) {
    preview.innerHTML = ''
    return
  }
  
  let html = '<table>'
  html = html + '<thead><tr>'
  for (let i = 0; i < columnsUsed; i++) {
    let isUsed = altSelected &&
      parseInt(altSelected.dataset.row) === 0 &&
      parseInt(altSelected.dataset.col) === i
    
    let alignment = alignments[i] || 'left'
    html = html + `<th contenteditable="true" data-row="0" data-col="${i}" class="${isUsed ? 'selected' : ''}" style="text-align: ${alignment}">${tableArray[0][i]}</th>`
  }
  html = html + '</tr></thead>'
  
  html = html + '<tbody>'
  for (let r = 1; r < tableArray.length; r++) {
    html = html + '<tr>'
    for (let i = 0; i < columnsUsed; i++) {
      let isUsed = altSelected &&
        parseInt(altSelected.dataset.row) === r &&
        parseInt(altSelected.dataset.col) === i
      let alignment = alignments[i] || 'left'
      
      html = html + `<td contenteditable="true" data-row="${r}" data-col="${i}" class="${isUsed ? 'selected' : ''}" style="text-align: ${alignment}">${tableArray[r][i]}</td>`
    }
    html = html + '</tr>'
  }
  html = html + '</tbody></table>'
  preview.innerHTML = html
  
  // Might use a for loop instead
  let content = preview.querySelectorAll('[contenteditable="true"]')
  content.forEach(function(i) {
    i.addEventListener('input', handlePreviewEdit)
    i.addEventListener('blur', handlePreviewEdit)
    i.addEventListener('focus', handlePreviewFocus)
    i.addEventListener('click', handlePreviewFocus)
  })
}

function handlePreviewEdit(event) {
  let content = event.target // whose text content you edit
  let row = parseInt(content.dataset.row)
  let col = parseInt(content.dataset.col)
  
  tableArray[row][col] = content.innerText
  updateTableMarkdown()
}

function handlePreviewFocus(event) {
  let tableElements = preview.querySelectorAll('td, th')
  tableElements.forEach(function(i) {
    i.classList.remove('selected')
  })
  
  let content = event.target
  if (!content.classList.contains('selected')) { content.classList.toggle('selected') }
  altSelected = content
  
  let i = parseInt(content.dataset.col)
  let alignment = alignments[i] || 'left'
  updateToolbarState(alignment)
}

// DROPDOWN HELPER FUNCTIONS
function setupDropdownHandler() {
  for (let r = 0; r < rowsHighest; r++) {
    let row = document.createElement('div')
    row.classList.toggle('grid-row')
    
    for (let j = 0; j < columnsHighest; j++) {
      let alt = document.createElement('div')
      alt.classList.toggle('grid-alt')
      alt.dataset.row = r + 1
      alt.dataset.col = j + 1
      
      alt.addEventListener('click', function(e) {
        e.preventDefault()
        e.stopPropagation()
        
        let previousTableArray = [...tableArray.map(function(row) {
          return [...row]
        })]
        let rowsOutdated = rowsUsed
        let columnsOudated = columnsUsed
        
        rowsUsed = parseInt(this.dataset.row)
        columnsUsed = parseInt(this.dataset.col)
        
        let content = document.querySelectorAll('.grid-alt')
        content.forEach(function(i) {
          let row = parseInt(i.dataset.row)
          let col = parseInt(i.dataset.col)
          
          if (!(row > rowsUsed || col > columnsUsed)) {
            i.classList.add('selected');
          } else {
            i.classList.remove('selected')
          }
        })
        
        size.textContent =
          `${rowsUsed}×${columnsUsed}`
        
        preserveTableArray(previousTableArray, rowsOutdated, columnsOudated)
        
        if (alignments.length < columnsUsed) {
          for (let i = alignments.length; i < columnsUsed; i++) {
            alignments[i] = 'left'
          }
        }
        
        generateTable()
      })
      
      row.appendChild(alt)
    }
    
    grid.appendChild(row)
  }
}

function generateTable() {
  if (rowsUsed === 0 || columnsUsed === 0) return
  updateTableMarkdown()
  updateTablePreview()
}

function preserveTableArray(previousTableArray = [], rowsOutdated = 0, columnsOudated = 0) {
  let newTableArray = []
  
  let headers = []
  for (let i = 0; i < columnsUsed; i++) {
    if (previousTableArray.length > 0 && i < columnsOudated) {
      headers.push(previousTableArray[0][i] || `Header ${i+1}`)
    } else {
      headers.push(`Header ${i+1}`)
    }
  }
  newTableArray.push(headers)
  
  for (let r = 0; r < rowsUsed; r++) {
    let row = []
    for (let i = 0; i < columnsUsed; i++) {
      if (previousTableArray.length > r + 1 && i < columnsOudated) {
        row.push(previousTableArray[r + 1][i] || `Cell ${r+1}-${i+1}`)
      } else {
        row.push(`Cell ${r+1}-${i+1}`)
      }
    }
    newTableArray.push(row)
  }
  
  tableArray = newTableArray
}
// --- START INVOICE.JS ---

function setInitialDate() {
    const invoiceDateInput = document.getElementById('invoiceDate');
    if(invoiceDateInput) invoiceDateInput.value = new Date().toISOString().split('T')[0];
}

let lineItemCount = 0;
function addLineItem(description = '', quantity = '', price = '') {
    lineItemCount++;
    const lineItemsContainer = document.getElementById('lineItemsContainer');
    const newItemHtml = `
        <div class="line-item p-3 border border-gray-200 rounded-md bg-gray-50" id="item-${lineItemCount}">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div class="md:col-span-6">
                    <input type="text" value="${description}" name="itemDescription-${lineItemCount}" class="form-input mt-1 text-sm" placeholder="Service or Product">
                </div>
                <div class="md:col-span-2">
                    <input type="number" value="${quantity}" name="itemQuantity-${lineItemCount}" class="form-input mt-1 text-sm text-right" min="0" step="any" placeholder="1">
                </div>
                <div class="md:col-span-2">
                    <input type="number" value="${price}" name="itemPrice-${lineItemCount}" class="form-input mt-1 text-sm text-right" min="0" step="0.01" placeholder="0.00">
                </div>
                <div class="md:col-span-1 text-right self-center">
                    <span id="itemTotal-${lineItemCount}" class="text-sm font-medium text-gray-700">$0.00</span>
                </div>
                <div class="md:col-span-1 text-right self-center">
                    <button type="button" class="removeItemBtn btn btn-danger btn-sm p-2 text-xs" data-itemid="${lineItemCount}">&times;</button>
                </div>
            </div>
        </div>`;
    if(lineItemsContainer) lineItemsContainer.insertAdjacentHTML('beforeend', newItemHtml);
    attachLineItemListeners(lineItemCount);
    updateLineItemTotal(lineItemCount);
    updateTotals();
}

function updateTotals() {
    const subtotalDisplay = document.getElementById('subtotalDisplay');
    const totalDisplay = document.getElementById('totalDisplay');
    const laborInput = document.getElementById('labor');
    const serviceCallInput = document.getElementById('serviceCall');
    const salesTaxRateInput = document.getElementById('salesTaxRate');
    const salesTaxAmountDisplay = document.getElementById('salesTaxAmountDisplay');

    let subtotal = 0;
    document.querySelectorAll('.line-item').forEach(item => {
        const id = item.id.split('-')[1];
        const quantityEl = document.querySelector(`[name=itemQuantity-${id}]`);
        const priceEl = document.querySelector(`[name=itemPrice-${id}]`);
        if (quantityEl && priceEl) {
            subtotal += (parseFloat(quantityEl.value) || 0) * (parseFloat(priceEl.value) || 0);
        }
    });
    if(subtotalDisplay) subtotalDisplay.textContent = formatCurrency(subtotal);
    const labor = laborInput ? (parseFloat(laborInput.value) || 0) : 0;
    const serviceCall = serviceCallInput ? (parseFloat(serviceCallInput.value) || 0) : 0;
    const taxRate = salesTaxRateInput ? (parseFloat(salesTaxRateInput.value) || 0) : 0;
    const salesTaxAmount = subtotal * (taxRate / 100);
    if(salesTaxAmountDisplay) salesTaxAmountDisplay.textContent = formatCurrency(salesTaxAmount);
    if(totalDisplay) totalDisplay.textContent = formatCurrency(subtotal + labor + serviceCall + salesTaxAmount);
}

function initializeSignaturePad() {
    const signatureCanvas = document.getElementById('signatureCanvas');
    if (typeof SignaturePad === 'undefined') {
        console.error("SignaturePad library is not loaded.");
        return;
    }
    if (signatureCanvas && !signaturePad) {
        signaturePad = new SignaturePad(signatureCanvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
        window.addEventListener("resize", () => resizeCanvas());
    }
}

function setFormEditable(editable) {
    const invoiceFormEl = document.getElementById('invoiceForm');
    const addItemBtn = document.getElementById('addItemBtn');
    const clearFormBtn = document.getElementById('clearFormBtn');
    isFormLocked = !editable;
    const formElements = invoiceFormEl.elements;
    for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        if (element.id !== 'invoiceNumberDisplay' && element.id !== 'salesTaxRate') {
            element.readOnly = !editable;
            element.disabled = !editable;
            if(!editable) {
                element.classList.add('bg-gray-100', 'cursor-not-allowed');
            } else {
                element.classList.remove('bg-gray-100', 'cursor-not-allowed');
            }
        }
    }
    if (addItemBtn) addItemBtn.disabled = !editable;
    document.querySelectorAll('.removeItemBtn').forEach(btn => btn.disabled = !editable);
    if (clearFormBtn) clearFormBtn.disabled = !editable;
    if (signaturePad) {
        if (editable) signaturePad.on();
        else signaturePad.off(); 
    }
}

function resizeCanvas() {
    const signatureCanvas = document.getElementById('signatureCanvas');
    const signaturePadContainer = document.querySelector('.signature-pad-container');
    if (!signatureCanvas || !signaturePad) return;
    if (signaturePadContainer && signaturePadContainer.offsetParent === null) return;
    const containerWidth = signaturePadContainer.offsetWidth;
    if (containerWidth === 0) return;
    const ratio =  Math.max(window.devicePixelRatio || 1, 1);
    signatureCanvas.width = containerWidth * ratio;
    signatureCanvas.height = 150 * ratio; 
    const ctx = signatureCanvas.getContext("2d");
    if (ctx) {
        ctx.scale(ratio, ratio);
    }
    signaturePad.clear();
}

function attachLineItemListeners(id) {
    const quantityInput = document.querySelector(`[name=itemQuantity-${id}]`);
    const priceInput = document.querySelector(`[name=itemPrice-${id}]`);
    const removeItemButton = document.querySelector(`#item-${id} .removeItemBtn`);
    if(quantityInput && priceInput) {
        [quantityInput, priceInput].forEach(input => {
            input.addEventListener('input', () => {
                updateLineItemTotal(id);
                updateTotals();
            });
        });
    }
    if (removeItemButton) {
        removeItemButton.addEventListener('click', () => {
            const itemToRemove = document.getElementById(`item-${id}`);
            if(itemToRemove) itemToRemove.remove();
            updateTotals();
        });
    }
}

function updateLineItemTotal(id) {
    const quantityEl = document.querySelector(`[name=itemQuantity-${id}]`);
    const priceEl = document.querySelector(`[name=itemPrice-${id}]`);
    if (!quantityEl || !priceEl) return;
    const quantity = parseFloat(quantityEl.value) || 0;
    const price = parseFloat(priceEl.value) || 0;
    const itemTotalEl = document.getElementById(`itemTotal-${id}`);
    if(itemTotalEl) itemTotalEl.textContent = formatCurrency(quantity * price);
}

function collectInvoiceData(autoGeneratedInvoiceNumber) {
    const invoiceFormEl = document.getElementById('invoiceForm');
    const chequeNumberInput = document.getElementById('chequeNumber');
    const formData = new FormData(invoiceFormEl);
    const selectedCountyTaxRadio = document.querySelector('input[name="countyTax"]:checked');
    const paymentMethodRadio = document.querySelector('input[name="paymentMethod"]:checked');
    let selectedCountyValue = selectedCountyTaxRadio ? selectedCountyTaxRadio.value : null;
    if (selectedCountyValue === 'Other') {
        selectedCountyValue = formData.get('customAreaName') || 'Custom';
    }
    const invoiceData = {
        invoiceNumber: autoGeneratedInvoiceNumber, 
        invoiceDate: formData.get('invoiceDate'),
        poNumber: formData.get('poNumber'),
        selectedCountyTax: selectedCountyValue, 
        planType: formData.get('planType'), 
        warrantyName: formData.get('warrantyName'), 
        customerName: document.getElementById('customerName').value.trim(),
        customerEmail: formData.get('customerEmail'), 
        customerPhone: formData.get('customerPhone'),
        customerAddress: document.getElementById('customerAddress').value,
        jobAddress: document.getElementById('jobAddress').value,
        typeOfEquipment: document.getElementById('typeOfEquipment').value,
        jobDescription: document.getElementById('jobDescription').value,
        recommendations: document.getElementById('recommendations').value,
        nonCoveredItems: document.getElementById('nonCoveredItemsText').value.trim(),
        paymentMethod: paymentMethodRadio ? paymentMethodRadio.value : null,
        chequeNumber: paymentMethodRadio && paymentMethodRadio.value === 'Cheque' ? chequeNumberInput.value.trim() : null,
        items: [],
        labor: (parseFloat(document.getElementById('labor').value) || 0),
        serviceCall: (parseFloat(document.getElementById('serviceCall').value) || 0),
        salesTaxRate: parseFloat(document.getElementById('salesTaxRate').value) || 0, 
        salesTaxAmount: 0,
        subtotal: 0,
        total: 0,
        status: 'pending', 
        signatureDataURL: confirmedSignatureDataURL, 
        signedBy: confirmedSignatureDataURL ? (document.getElementById('customerName')?.value.trim() || "Customer") : null,
    };
    let currentSubtotal = 0;
    document.querySelectorAll('.line-item').forEach(item => {
        const id = item.id.split('-')[1];
        const descriptionEl = document.querySelector(`[name=itemDescription-${id}]`);
        const quantityEl = document.querySelector(`[name=itemQuantity-${id}]`);
        const priceEl = document.querySelector(`[name=itemPrice-${id}]`);
        if(descriptionEl && quantityEl && priceEl){
            const description = descriptionEl.value;
            const quantity = parseFloat(quantityEl.value) || 0;
            const price = parseFloat(priceEl.value) || 0;
            invoiceData.items.push({ description, quantity, price, total: quantity * price });
            currentSubtotal += quantity * price;
        }
    });
    invoiceData.subtotal = currentSubtotal;
    if (auth.currentUser && auth.currentUser.uid) {
        invoiceData.createdByWorkerId = auth.currentUser.uid;
        invoiceData.workerName = auth.currentUser.displayName || (auth.currentUser.email ? auth.currentUser.email.split('@')[0] : 'N/A');
    }
    invoiceData.salesTaxAmount = invoiceData.subtotal * (invoiceData.salesTaxRate / 100);
    invoiceData.total = invoiceData.subtotal + invoiceData.labor + invoiceData.serviceCall + invoiceData.salesTaxAmount;
    return invoiceData;
}

function populateInvoiceForm(job) {
    console.log("Populating invoice form with job data:", job);

    const invoiceFormEl = document.getElementById('invoiceForm');
    const lineItemsContainer = document.getElementById('lineItemsContainer');
    const salesTaxRateInput = document.getElementById('salesTaxRate');
    const customTaxArea = document.getElementById('customTaxArea');
    const chequeNumberArea = document.getElementById('chequeNumberArea');

    // Reset form to a clean state
    if(invoiceFormEl) invoiceFormEl.reset();
    if(lineItemsContainer) lineItemsContainer.innerHTML = '';
    
    // Set customer and job details
    document.getElementById('customerName').value = job.customer || '';
    document.getElementById('customerAddress').value = job.address || '';
    document.getElementById('customerPhone').value = job.phone || '';
    document.getElementById('jobAddress').value = job.address || ''; // Assuming job address is same as customer address
    
    document.getElementById('poNumber').value = job.dispatchOrPoNumber || '';
    
    // Auto-fill warranty details
    document.getElementById('planType').value = job.planType || '';
    document.getElementById('warrantyName').value = job.warrantyName || '';

    // Set other fields to default/initial states
    setInitialDate();
    if (salesTaxRateInput) salesTaxRateInput.value = "0.00";
    if (customTaxArea) customTaxArea.classList.add('hidden');
    if (chequeNumberArea) chequeNumberArea.classList.add('hidden');

    // Add a default line item
    addLineItem();
    
    // Recalculate totals
    updateTotals();

    // Initialize signature pad
    if (!signaturePad) {
        initializeSignaturePad();
    } else {
        signaturePad.clear();
    }
    
    // Ensure form is editable
    setFormEditable(true);
}

function formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
}

// --- END INVOICE.JS ---

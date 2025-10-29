document.addEventListener('DOMContentLoaded', () => {
    const appContent = document.getElementById('appContent');
    const dashboardSection = document.getElementById('dashboardSection');
    const addClientSection = document.getElementById('addClientSection');
    const createOrderSection = document.getElementById('createOrderSection');

    const dashboardBtn = document.getElementById('dashboardBtn');
    const addClientBtn = document.getElementById('addClientBtn');
    const createOrderBtn = document.getElementById('createOrderBtn');

    const addClientForm = document.getElementById('addClientForm');
    const addClientMessage = document.getElementById('addClientMessage');

    const createOrderForm = document.getElementById('createOrderForm');
    const selectClient = document.getElementById('selectClient');
    const productsContainer = document.getElementById('productsContainer');
    const addProductBtn = document.getElementById('addProductBtn');
    const createOrderMessage = document.getElementById('createOrderMessage');
    const ordersList = document.getElementById('ordersList');

    let allClients = []; // To store client data
    let allProductTypes = []; // To store product types

    // --- Utility Functions ---
    function showSection(sectionToShow) {
        dashboardSection.classList.add('hidden-section');
        addClientSection.classList.add('hidden-section');
        createOrderSection.classList.add('hidden-section');
        sectionToShow.classList.remove('hidden-section');
    }

    async function fetchClients() {
        const response = await fetch('/api/clients');
        allClients = await response.json();
        populateClientSelect();
    }

    async function fetchProductTypes() {
        const response = await fetch('/api/productTypes');
        allProductTypes = await response.json();
    }

    function populateClientSelect() {
        selectClient.innerHTML = '<option value="">-- Select a client --</option>';
        allClients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.name} (${client.phoneNo})`;
            selectClient.appendChild(option);
        });
    }

    // --- Dashboard ---
    async function loadDashboard() {
        showSection(dashboardSection);
        ordersList.innerHTML = 'Loading orders...';
        const response = await fetch('/api/orders');
        const orders = await response.json();
        ordersList.innerHTML = ''; // Clear previous orders

        if (orders.length === 0) {
            ordersList.innerHTML = '<p>No orders yet. Create one!</p>';
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.classList.add('order-card');
            orderCard.innerHTML = `
                <h4>Order ID: ${order.id}</h4>
                <p><strong>Client:</strong> ${order.clientName}</p>
                <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <h5>Products:</h5>
                <ul>
                    ${order.products.map(p => {
                        const productTypeName = allProductTypes.find(pt => pt.id === p.productId)?.name || 'Unknown Product';
                        return `<li>${productTypeName} 
                                    (Measurements: ${JSON.stringify(p.measurements)}) 
                                    ${p.notes ? `[Notes: ${p.notes}]` : ''}
                                </li>`;
                    }).join('')}
                </ul>
            `;
            ordersList.appendChild(orderCard);
        });
    }

    // --- Add Client ---
    addClientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addClientForm);
        const clientData = Object.fromEntries(formData.entries());

        const response = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientData)
        });

        if (response.ok) {
            const newClient = await response.json();
            addClientMessage.textContent = `Client ${newClient.name} added successfully!`;
            addClientForm.reset();
            await fetchClients(); // Refresh client list for order creation
            setTimeout(() => addClientMessage.textContent = '', 3000);
        } else {
            addClientMessage.textContent = 'Error adding client.';
        }
    });

    // --- Create Order ---
    let productCounter = 0;
    function addProductInput() {
        productCounter++;
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        productDiv.innerHTML = `
            <label for="productType-${productCounter}">Product Type:</label>
            <select id="productType-${productCounter}" name="productType-${productCounter}" class="product-type-select" required>
                <option value="">-- Select Product Type --</option>
                ${allProductTypes.map(pt => `<option value="${pt.id}">${pt.name}</option>`).join('')}
            </select><br>
            <div id="measurements-${productCounter}" class="measurements-input">
                <!-- Measurement fields will be loaded here dynamically -->
            </div>
            <label for="productNotes-${productCounter}">Notes for this product:</label>
            <textarea id="productNotes-${productCounter}" name="productNotes-${productCounter}"></textarea>
            <button type="button" class="remove-product-btn">Remove Product</button>
        `;
        productsContainer.appendChild(productDiv);

        // Add event listener for product type change to load measurements
        productDiv.querySelector(`#productType-${productCounter}`).addEventListener('change', (event) => {
            loadMeasurementsForProduct(event.target.value, `measurements-${productCounter}`);
        });

        // Add event listener for remove button
        productDiv.querySelector('.remove-product-btn').addEventListener('click', () => {
            productDiv.remove();
        });
    }

    // Function to dynamically load measurement fields based on product type
    // This is a simplified example. In a real app, you'd fetch specific measurements for each product type.
    function loadMeasurementsForProduct(productTypeId, containerId) {
        const measurementsDiv = document.getElementById(containerId);
        measurementsDiv.innerHTML = ''; // Clear previous measurements

        let fields = [];
        if (productTypeId === 'pt001') { // Shirt
            fields = ['Neck', 'Chest', 'Shoulder', 'Sleeve Length', 'Shirt Length'];
        } else if (productTypeId === 'pt002') { // Kurta
            fields = ['Neck', 'Chest', 'Shoulder', 'Sleeve Length', 'Kurta Length'];
        } else if (productTypeId === 'pt003') { // Pant
            fields = ['Waist', 'Hip', 'Inseam', 'Outer Seam', 'Thigh', 'Bottom'];
        } else if (productTypeId === 'pt004') { // Jacket
            fields = ['Chest', 'Shoulder', 'Sleeve Length', 'Jacket Length'];
        }

        fields.forEach(field => {
            const label = document.createElement('label');
            label.textContent = `${field}:`;
            const input = document.createElement('input');
            input.type = 'text';
            input.name = `${field.toLowerCase().replace(/\s/g, '')}`; // e.g., neck, sleeveLength
            input.placeholder = `${field} (inches)`;
            measurementsDiv.appendChild(label);
            measurementsDiv.appendChild(input);
        });
    }


    addProductBtn.addEventListener('click', addProductInput);

    createOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const clientId = selectClient.value;
        if (!clientId) {
            createOrderMessage.textContent = 'Please select a client.';
            return;
        }

        const products = [];
        document.querySelectorAll('.product-item').forEach(productDiv => {
            const productTypeSelect = productDiv.querySelector('.product-type-select');
            const productTypeId = productTypeSelect.value;
            const productNotes = productDiv.querySelector('textarea').value;

            if (productTypeId) {
                const measurements = {};
                productDiv.querySelectorAll('.measurements-input input').forEach(input => {
                    if (input.value) {
                        measurements[input.name] = input.value;
                    }
                });

                products.push({
                    productId: productTypeId,
                    measurements: measurements,
                    notes: productNotes
                });
            }
        });

        if (products.length === 0) {
            createOrderMessage.textContent = 'Please add at least one product.';
            return;
        }

        const orderData = {
            clientId: clientId,
            products: products
        };

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const newOrder = await response.json();
            createOrderMessage.textContent = `Order ${newOrder.id} created successfully!`;
            createOrderForm.reset();
            productsContainer.innerHTML = ''; // Clear products
            productCounter = 0; // Reset counter
            addProductInput(); // Add initial product field
            await loadDashboard(); // Refresh dashboard with new order
            setTimeout(() => createOrderMessage.textContent = '', 3000);
        } else {
            createOrderMessage.textContent = 'Error creating order.';
        }
    });

    // --- Navigation ---
    dashboardBtn.addEventListener('click', loadDashboard);
    addClientBtn.addEventListener('click', () => showSection(addClientSection));
    createOrderBtn.addEventListener('click', () => {
        showSection(createOrderSection);
        // Ensure client select and product types are loaded
        fetchClients();
        fetchProductTypes();
        // Ensure at least one product input is available
        if (productsContainer.children.length === 0) {
            addProductInput();
        }
    });

    // --- Initial Load ---
    fetchClients();
    fetchProductTypes();
    loadDashboard(); // Load dashboard by default
});
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
    // REMOVED: const selectClient = document.getElementById('selectClient');
    // NEW CLIENT SEARCH ELEMENTS
    const clientSearchInput = document.getElementById('clientSearchInput');
    const clientSuggestions = document.getElementById('clientSuggestions');
    const selectedClientIdInput = document.getElementById('selectedClientId');
    const selectedClientDisplay = document.getElementById('selectedClientDisplay');

    const productsContainer = document.getElementById('productsContainer');
    const addProductBtn = document.getElementById('addProductBtn');
    const createOrderMessage = document.getElementById('createOrderMessage');
    const ordersList = document.getElementById('ordersList');

    let allClients = []; // To store client data fetched from API
    let allProductTypes = []; // To store product types fetched from API
    let selectedClient = null; // To store the currently selected client object for order creation

    // --- Utility Functions ---
    function showSection(sectionToShow) {
        dashboardSection.classList.add('hidden-section');
        addClientSection.classList.add('hidden-section');
        createOrderSection.classList.add('hidden-section');
        sectionToShow.classList.remove('hidden-section');
    }

    async function fetchClients() {
        try {
            const response = await fetch('/api/clients');
            allClients = await response.json();
            // populateClientSelect(); // No longer needed for dropdown
        } catch (error) {
            console.error('Error fetching clients:', error);
            // Optionally, display an error message on the UI
        }
    }

    async function fetchProductTypes() {
        try {
            const response = await fetch('/api/productTypes');
            allProductTypes = await response.json();
        } catch (error) {
            console.error('Error fetching product types:', error);
        }
    }

    // --- Dashboard ---
    async function loadDashboard() {
        showSection(dashboardSection);
        ordersList.innerHTML = 'Loading orders...';
        try {
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
                            // Format measurements nicely
                            const measurementsHtml = Object.keys(p.measurements).length > 0
                                ? `(${Object.entries(p.measurements).map(([key, value]) => `${key}: ${value}`).join(', ')})`
                                : '';
                            return `<li>${productTypeName} ${measurementsHtml} ${p.notes ? `[Notes: ${p.notes}]` : ''}</li>`;
                        }).join('')}
                    </ul>
                `;
                ordersList.appendChild(orderCard);
            });
        } catch (error) {
            console.error('Error loading dashboard orders:', error);
            ordersList.innerHTML = '<p>Error loading orders. Please try again.</p>';
        }
    }

    // --- Add Client ---
    addClientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addClientForm);
        const clientData = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });

            if (response.ok) {
                const newClient = await response.json();
                addClientMessage.textContent = `Client ${newClient.name} added successfully!`;
                addClientForm.reset();
                await fetchClients(); // Refresh client list for order creation search
                setTimeout(() => addClientMessage.textContent = '', 3000);
            } else {
                const errorData = await response.json();
                addClientMessage.textContent = `Error adding client: ${errorData.message || response.statusText}`;
            }
        } catch (error) {
            console.error('Error adding client:', error);
            addClientMessage.textContent = 'Error adding client. Please check your network.';
        }
    });

    // --- Live Client Search (NEW LOGIC) ---
    clientSearchInput.addEventListener('input', () => {
        const searchText = clientSearchInput.value.toLowerCase();
        clientSuggestions.innerHTML = ''; // Clear previous suggestions

        // Clear currently selected client if the input changes
        selectedClient = null;
        selectedClientIdInput.value = '';
        selectedClientDisplay.textContent = '';

        if (searchText.length < 2) { // Start searching after 2 characters
            return;
        }

        const filteredClients = allClients.filter(client =>
            client.phoneNo.toLowerCase().includes(searchText) ||
            client.name.toLowerCase().includes(searchText)
        );

        if (filteredClients.length > 0) {
            filteredClients.forEach(client => {
                const suggestionItem = document.createElement('div');
                suggestionItem.classList.add('suggestion-item');
                suggestionItem.textContent = `${client.name} (${client.phoneNo})`;
                suggestionItem.addEventListener('click', () => {
                    selectedClient = client; // Store the full client object
                    selectedClientIdInput.value = client.id;
                    selectedClientDisplay.textContent = `Selected: ${client.name} (${client.phoneNo})`;
                    clientSearchInput.value = client.phoneNo; // Fill input with phone number for confirmation
                    clientSuggestions.innerHTML = ''; // Clear suggestions
                });
                clientSuggestions.appendChild(suggestionItem);
            });
        } else {
            clientSuggestions.innerHTML = '<div class="suggestion-item">No clients found.</div>';
        }
    });

    // Handle clicking outside the suggestions box to close it
    document.addEventListener('click', (event) => {
        if (!clientSearchInput.contains(event.target) && !clientSuggestions.contains(event.target)) {
            clientSuggestions.innerHTML = '';
        }
    });


    // --- Create Order ---
    let productCounter = 0; // Ensures unique IDs for product inputs

    function addProductInput() {
        productCounter++;
        const productDiv = document.createElement('div');
        productDiv.classList.add('product-item');
        productDiv.setAttribute('data-product-index', productCounter); // To identify this product item
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
            // Use a consistent naming convention for measurement inputs
            input.name = `measurement_${field.toLowerCase().replace(/\s/g, '')}`;
            input.placeholder = `${field} (e.g., 16)`;
            measurementsDiv.appendChild(label);
            measurementsDiv.appendChild(input);
        });
    }


    addProductBtn.addEventListener('click', addProductInput);

    createOrderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get client ID from the hidden input, which is set by selecting a suggestion
        const clientId = selectedClientIdInput.value;
        if (!clientId || !selectedClient) { // Ensure both ID and object are set
            createOrderMessage.textContent = 'Please select a client using the search bar before placing an order.';
            return;
        }
        // Basic check to ensure the selected client hasn't been "un-selected" by typing
        if (selectedClient.id !== clientId) {
             createOrderMessage.textContent = 'Client selection error. Please re-select the client from suggestions.';
             return;
        }

        const products = [];
        document.querySelectorAll('.product-item').forEach(productDiv => {
            const productTypeSelect = productDiv.querySelector('.product-type-select');
            const productTypeId = productTypeSelect.value;
            const productNotes = productDiv.querySelector('textarea').value;

            // Only add products that have a product type selected
            if (productTypeId) {
                const measurements = {};
                productDiv.querySelectorAll('.measurements-input input').forEach(input => {
                    // Extract the clean measurement name from input.name
                    const measurementKey = input.name.replace('measurement_', '');
                    if (input.value) {
                        measurements[measurementKey] = input.value;
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
            createOrderMessage.textContent = 'Please add at least one product with a selected type to the order.';
            return;
        }

        const orderData = {
            clientId: clientId,
            products: products,
            // You can add other order details here like deliveryDate, etc.
        };

        try {
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
                addProductInput(); // Add initial product field for next order
                // Reset client search fields after successful order
                clientSearchInput.value = '';
                selectedClientIdInput.value = '';
                selectedClientDisplay.textContent = '';
                selectedClient = null; // Clear selected client object
                clientSuggestions.innerHTML = ''; // Clear suggestions
                await loadDashboard(); // Refresh dashboard with new order
                setTimeout(() => createOrderMessage.textContent = '', 3000);
            } else {
                const errorData = await response.json();
                createOrderMessage.textContent = `Error creating order: ${errorData.message || response.statusText}`;
            }
        } catch (error) {
            console.error('Error creating order:', error);
            createOrderMessage.textContent = 'Error creating order. Please check your network.';
        }
    });

    // --- Navigation ---
    dashboardBtn.addEventListener('click', loadDashboard);
    addClientBtn.addEventListener('click', () => showSection(addClientSection));
    createOrderBtn.addEventListener('click', () => {
        showSection(createOrderSection);
        // Ensure client list and product types are loaded whenever 'Create Order' is clicked
        fetchClients(); // This now populates `allClients` for the search input
        fetchProductTypes();
        // Ensure at least one product input is available when starting a new order
        if (productsContainer.children.length === 0) {
            addProductInput();
        }
        // Clear any previous client selection state when opening the 'Create Order' section
        clientSearchInput.value = '';
        selectedClientIdInput.value = '';
        selectedClientDisplay.textContent = '';
        selectedClient = null;
        clientSuggestions.innerHTML = '';
    });

    // --- Initial Load ---
    // Fetch initial data needed for dashboard and client search
    fetchClients();
    fetchProductTypes();
    loadDashboard(); // Load dashboard by default when the page loads
});
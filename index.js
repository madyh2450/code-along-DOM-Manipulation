const qaItems = [
	{
		question: "How do I track my package?",
		answer: "You can easily track your package using our online tracking system. Simply enter your tracking number on our website to get real-time updates on your delivery status.",
	},
	{
		question: "What should I do if my package is damaged or lost?",
		answer: "If your package arrives damaged or lost in transit, please contact us immediately. We will investigate the matter and arrange for a replacement or refund as per our policy.",
	},
	{
		question: "Can I change my delivery address after placing an order?",
		answer: "Yes, you can change your delivery address as long as the package has not been dispatched. Please contact our customer service team as soon as possible to make any changes.",
	},
	{
		question: "Are there any items that cannot be shipped?",
		answer: "Yes, there are certain restrictions on items that can be shipped due to safety and legal reasons. Please refer to our policy or contact us for more information on prohibited items.",
	},
];

// Initialize Accordion
const accordionDiv = document.getElementById("accordion");

if (accordionDiv) {
	qaItems.forEach((qaItem) => {
		const questionText = qaItem.question;
		const answerText = qaItem.answer;

		const wrapper = document.createElement("div");
		wrapper.classList.add("accordion-item");

		const questionDiv = document.createElement("div");
		questionDiv.classList.add("accordion-question");
		questionDiv.textContent = questionText;

		const answerDiv = document.createElement("div");
		answerDiv.classList.add("accordion-answer");
		answerDiv.textContent = answerText;

		wrapper.appendChild(questionDiv);
		wrapper.appendChild(answerDiv);

		questionDiv.addEventListener("click", () => {
			questionDiv.classList.toggle("active");
			answerDiv.classList.toggle("active");
		});

		accordionDiv.appendChild(wrapper);
	});
}

class DatabaseObject {
	string() {
		throw new Error("Not Implemented");
	}
}

class Product extends DatabaseObject {
	constructor(name, inventory) {
		super();
		this.name = name;
		this.inventory = inventory;
	}

	string() {
		return `${this.name}: ${this.inventory} left in stock`;
	}

	toString() {
		return this.string();
	}
}

class Delivery extends DatabaseObject {
	constructor(params) {
		super();
		const { address, scheduledTime, product, quantity } = params;
		this.address = address;
		this.scheduledTime = scheduledTime;
		this.product = product;
		this.quantity = quantity;
	}

	string() {
		return `Delivering ${this.quantity} of ${this.product.name} to ${this.address} at ${this.scheduledTime}`;
	}

	toString() {
		return this.string();
	}

	static create(params) {
		return new Delivery(params);
	}
}

class ProductDao {
	static seeds = [
		{ name: "Apples", inventory: 100 },
		{ name: "Bananas", inventory: 90 },
		{ name: "Peaches", inventory: 70 },
	];
	getAll() {
		throw new Error("Not Implemented");
	}
	getProductByName(name) {
		const products = this.getAll();
		return products.find((product) => product.name === name);
	}
	update(product) {
		throw new Error("Not Implemented");
	}
}

class SessionsStorageProductDao extends ProductDao {
	constructor() {
		super();
		this.database = sessionStorage;
	}

	getAll() {
		const productsAsJSON = this.database.getItem("products");
		const productsData = productsAsJSON
			? JSON.parse(productsAsJSON)
			: ProductDao.seeds;
		return productsData.map((productData) => {
			const { name, inventory } = productData;
			return new Product(name, inventory);
		});
	}

	update(product) {
		const existingProducts = this.getAll();
		const indexToUpdate = existingProducts.findIndex(
			(p) => p.name === product.name,
		);
		if (indexToUpdate !== -1) {
			existingProducts.splice(indexToUpdate, 1, product);
		} else {
			existingProducts.push(product);
		}
		this.database.setItem("products", JSON.stringify(existingProducts));
	}
}

class CookieStorageProductDao extends ProductDao {
	getAll() {
		const cookiePair = document.cookie
			.split("; ")
			.find((row) => row.startsWith("products="));
		const cookieValue = cookiePair ? cookiePair.split("=")[1] : null;
		const productsData = cookieValue
			? JSON.parse(cookieValue)
			: ProductDao.seeds;
		return productsData.map(
			(data) => new Product(data.name, data.inventory),
		);
	}

	update(product) {
		const existingProducts = this.getAll();
		const indexToUpdate = existingProducts.findIndex(
			(p) => p.name === product.name,
		);
		if (indexToUpdate !== -1) {
			existingProducts.splice(indexToUpdate, 1, product);
		} else {
			existingProducts.push(product);
		}
		document.cookie = `products=${JSON.stringify(
			existingProducts,
		)}; max-age=30; path=/`;
	}
}

class DeliveryDao {
	getAll() {
		throw new Error("Not Implemented");
	}
	create(delivery) {
		throw new Error("Not Implemented");
	}
}

class SessionsStorageDeliveryDao extends DeliveryDao {
	constructor() {
		super();
		this.database = sessionStorage;
	}

	getAll() {
		const deliveriesInSessionStorage = this.database.getItem("deliveries");
		const deliveriesData = deliveriesInSessionStorage
			? JSON.parse(deliveriesInSessionStorage)
			: [];
		return deliveriesData.map((deliveryData) =>
			Delivery.create(deliveryData),
		);
	}

	create(delivery) {
		const deliveries = this.getAll();
		deliveries.push(delivery);
		this.database.setItem("deliveries", JSON.stringify(deliveries));
	}
}

class CookieStorageDeliveryDao extends DeliveryDao {
	getAll() {
		const cookiePair = document.cookie
			.split("; ")
			.find((row) => row.startsWith("deliveries="));
		const cookieValue = cookiePair ? cookiePair.split("=")[1] : null;
		const deliveriesData = cookieValue ? JSON.parse(cookieValue) : [];
		return deliveriesData.map((deliveryData) => new Delivery(deliveryData));
	}

	create(delivery) {
		const existingDeliveries = this.getAll();
		existingDeliveries.push(delivery);
		document.cookie = `deliveries=${JSON.stringify(
			existingDeliveries,
		)}; max-age=10; path=/`;
	}
}

// Core Services
class CreateDeliveryService {
	constructor(productDao, deliveryDao) {
		this.productDao = productDao;
		this.deliveryDao = deliveryDao;
	}

	createDelivery(productName, quantity, address, scheduledTime) {
		const product = this.productDao.getProductByName(productName);
		if (!product) return;

		product.inventory -= quantity;
		const deliveryData = {
			product,
			quantity,
			address,
			scheduledTime,
		};
		this.deliveryDao.create(deliveryData);
		this.productDao.update(product);
	}
}

// Application Orchestration (Runs on Page Load)
document.addEventListener("DOMContentLoaded", () => {
	// Choose your Storage strategy here
	const productDao = new SessionsStorageProductDao();
	const deliveryDao = new SessionsStorageDeliveryDao();

	const deliveryService = new CreateDeliveryService(productDao, deliveryDao);

	// Render Deliveries List
	const deliveryList = document.getElementById("deliveries-list");
	function renderDeliveries() {
		if (!deliveryList) return;
		deliveryList.innerHTML = "";
		const deliveries = deliveryDao.getAll();
		deliveries.forEach((delivery) => {
			const deliveryLi = document.createElement("li");
			deliveryLi.textContent = delivery.string();
			deliveryList.appendChild(deliveryLi);
		});
	}

	// Populate Product Options dropdown
	const productNameSelect = document.querySelector("#deliveries form select");
	const products = productDao.getAll();
	if (productNameSelect) {
		products.forEach((product) => {
			const option = document.createElement("option");
			option.innerText = product.string();
			option.setAttribute("value", product.name);
			productNameSelect.appendChild(option);
		});
	}

	// Dynamic max attribute based on stock selection
	function handleChangeToProductName(event) {
		const quantityInput = document.querySelector(
			"#deliveries form input[name='quantity']",
		);
		const productName = event.target.value;
		const selectedProduct = productDao.getProductByName(productName);
		if (selectedProduct && quantityInput) {
			quantityInput.setAttribute("max", selectedProduct.inventory);
		}
	}

	if (productNameSelect) {
		productNameSelect.addEventListener("change", handleChangeToProductName);
		// Fire once to handle initial selection constraint
		productNameSelect.dispatchEvent(new Event("change"));
	}

	// Form Event Handler
	const createDeliveryForm = document.querySelector("#deliveries form");
	if (createDeliveryForm) {
		createDeliveryForm.addEventListener("submit", (event) => {
			event.preventDefault(); // Stop page reload

			const formData = new FormData(event.target);
			const address = formData.get("address");
			const scheduledTime = formData.get("scheduledTime");
			const productName = formData.get("productName");
			const quantity = parseInt(formData.get("quantity"), 10);

			deliveryService.createDelivery(
				productName,
				quantity,
				address,
				scheduledTime,
			);

			// Refresh views
			renderDeliveries();
			if (productNameSelect) {
				productNameSelect.innerHTML = "";
				productDao.getAll().forEach((product) => {
					const option = document.createElement("option");
					option.innerText = product.string();
					option.setAttribute("value", product.name);
					productNameSelect.appendChild(option);
				});
				productNameSelect.dispatchEvent(new Event("change"));
			}
			createDeliveryForm.reset();
		});
	}

	// Run initial delivery list build
	renderDeliveries();
});

// class CookieStorageProductDao extends ProductDao {
// 	constructor() {
// 		this.database = document.cookie;
// 	}
// 	getAll() {
// 		const productsAsJSON = this.database.getItem("products");
// 		return productsAsJSON ? JSON.parse(productsAsJSON) : [];
// 	}

// 	date(product) {
// 		const existingProducts = this.getAll();
// 		const indexToDelete = existingProducts.findIndex(
// 			(productInList) => productInList.name == product.name,
// 		);
// 		existingProducts.splice(indexToDelete, 1, product);
// 	}
// }

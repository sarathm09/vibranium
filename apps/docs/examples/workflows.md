# Complex Workflows

This guide demonstrates complex multi-step workflows that showcase the power of Vibranium CLI's dependency management and variable system.

## E-commerce Checkout Flow

A comprehensive e-commerce workflow testing user registration, product browsing, cart management, and checkout:

```yaml
name: e2commerce_checkout_flow
description: "Complete e-commerce checkout workflow"
version: "1.0"
tags: ["e-commerce", "workflow", "integration"]

variables:
  apiUrl: "{{$.env.API_URL}}"
  testUser:
    email: "{{$.random.email}}"
    password: "{{$.random.password}}"
    firstName: "{{$.random.firstName}}"
    lastName: "{{$.random.lastName}}"

steps:
  # User Registration
  - name: register_user
    description: "Register new user account"
    type: api
    method: POST
    url: "{{$.variables.apiUrl}}/auth/register"
    body:
      email: "{{$.variables.testUser.email}}"
      password: "{{$.variables.testUser.password}}"
      firstName: "{{$.variables.testUser.firstName}}"
      lastName: "{{$.variables.testUser.lastName}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201
    extract:
      - name: userId
        identifier: "$.response.body.user.id"

  # Email Verification
  - name: verify_email
    description: "Verify user email address"
    type: api
    dependsOn:
      - api: register_user
        as: user
    method: POST
    url: "{{$.variables.apiUrl}}/auth/verify-email"
    body:
      userId: "{{$.user.extract.userId}}"
      token: "mock-verification-token"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200

  # User Login
  - name: login
    description: "Login with verified account"
    type: api
    method: POST
    url: "{{$.variables.apiUrl}}/auth/login"
    body:
      email: "{{$.variables.testUser.email}}"
      password: "{{$.variables.testUser.password}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.token"
        operator: exists
    extract:
      - name: authToken
        identifier: "$.response.body.token"

  # Browse Products
  - name: get_products
    description: "Browse available products"
    type: api
    method: GET
    url: "{{$.variables.apiUrl}}/products"
    query:
      category: "electronics"
      limit: 10
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.products"
        operator: type
        expected: "array"
      - identifier: "$.response.body.products"
        operator: min_length
        expected: 1
    extract:
      - name: selectedProduct
        identifier: "$.response.body.products[0]"

  # Add to Cart
  - name: add_to_cart
    description: "Add product to shopping cart"
    type: api
    dependsOn:
      - api: login
        as: auth
      - api: get_products
        as: products
    method: POST
    url: "{{$.variables.apiUrl}}/cart/items"
    headers:
      Authorization: "Bearer {{$.auth.extract.authToken}}"
    body:
      productId: "{{$.products.extract.selectedProduct.id}}"
      quantity: 2
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201

  # Get Cart
  - name: get_cart
    description: "Retrieve shopping cart"
    type: api
    dependsOn:
      - api: login
        as: auth
    method: GET
    url: "{{$.variables.apiUrl}}/cart"
    headers:
      Authorization: "Bearer {{$.auth.extract.authToken}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.items"
        operator: length
        expected: 1
      - identifier: "$.response.body.total"
        operator: gt
        expected: 0
    extract:
      - name: cartTotal
        identifier: "$.response.body.total"

  # Create Order
  - name: create_order
    description: "Create order from cart"
    type: api
    dependsOn:
      - api: login
        as: auth
    method: POST
    url: "{{$.variables.apiUrl}}/orders"
    headers:
      Authorization: "Bearer {{$.auth.extract.authToken}}"
    body:
      shippingAddress:
        street: "{{$.random.address.streetAddress}}"
        city: "{{$.random.address.city}}"
        state: "{{$.random.address.state}}"
        zipCode: "{{$.random.address.zipCode}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201
      - identifier: "$.response.body.orderId"
        operator: exists
    extract:
      - name: orderId
        identifier: "$.response.body.orderId"

  # Process Payment
  - name: process_payment
    description: "Process payment for order"
    type: api
    dependsOn:
      - api: login
        as: auth
      - api: create_order
        as: order
      - api: get_cart
        as: cart
    method: POST
    url: "{{$.variables.apiUrl}}/payments"
    headers:
      Authorization: "Bearer {{$.auth.extract.authToken}}"
    body:
      orderId: "{{$.order.extract.orderId}}"
      amount: "{{$.cart.extract.cartTotal}}"
      paymentMethod:
        type: "credit_card"
        cardNumber: "4111111111111111"
        expiryMonth: "12"
        expiryYear: "2025"
        cvv: "123"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.status"
        operator: equals
        expected: "succeeded"

  # Confirm Order
  - name: confirm_order
    description: "Confirm order completion"
    type: api
    dependsOn:
      - api: login
        as: auth
      - api: create_order
        as: order
    method: GET
    url: "{{$.variables.apiUrl}}/orders/{{$.order.extract.orderId}}"
    headers:
      Authorization: "Bearer {{$.auth.extract.authToken}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
      - identifier: "$.response.body.status"
        operator: equals
        expected: "confirmed"
```

## Multi-Service Integration Test

Test a microservices architecture with multiple service dependencies:

```yaml
name: microservices_integration
description: "Multi-service integration workflow"
tags: ["microservices", "integration", "distributed"]

variables:
  userServiceUrl: "{{$.env.USER_SERVICE_URL}}"
  orderServiceUrl: "{{$.env.ORDER_SERVICE_URL}}"
  paymentServiceUrl: "{{$.env.PAYMENT_SERVICE_URL}}"
  notificationServiceUrl: "{{$.env.NOTIFICATION_SERVICE_URL}}"

steps:
  # Health checks for all services
  - name: user_service_health
    description: "Check user service health"
    type: api
    method: GET
    url: "{{$.variables.userServiceUrl}}/health"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200

  - name: order_service_health
    description: "Check order service health"
    type: api
    method: GET
    url: "{{$.variables.orderServiceUrl}}/health"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200

  - name: payment_service_health
    description: "Check payment service health"
    type: api
    method: GET
    url: "{{$.variables.paymentServiceUrl}}/health"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200

  # Create user in user service
  - name: create_user
    description: "Create user in user service"
    type: api
    method: POST
    url: "{{$.variables.userServiceUrl}}/users"
    body:
      email: "{{$.random.email}}"
      name: "{{$.random.name}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201
    extract:
      - name: userId
        identifier: "$.response.body.id"

  # Create order in order service
  - name: create_order
    description: "Create order in order service"
    type: api
    dependsOn:
      - api: create_user
        as: user
    method: POST
    url: "{{$.variables.orderServiceUrl}}/orders"
    body:
      userId: "{{$.user.extract.userId}}"
      items:
        - productId: "prod-123"
          quantity: 2
          price: 29.99
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201
    extract:
      - name: orderId
        identifier: "$.response.body.id"
      - name: totalAmount
        identifier: "$.response.body.total"

  # Process payment
  - name: process_payment
    description: "Process payment in payment service"
    type: api
    dependsOn:
      - api: create_order
        as: order
    method: POST
    url: "{{$.variables.paymentServiceUrl}}/payments"
    body:
      orderId: "{{$.order.extract.orderId}}"
      amount: "{{$.order.extract.totalAmount}}"
      currency: "USD"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 200
    extract:
      - name: paymentId
        identifier: "$.response.body.id"

  # Send notification
  - name: send_notification
    description: "Send order confirmation notification"
    type: api
    dependsOn:
      - api: create_user
        as: user
      - api: create_order
        as: order
    method: POST
    url: "{{$.variables.notificationServiceUrl}}/notifications"
    body:
      userId: "{{$.user.extract.userId}}"
      type: "order_confirmation"
      data:
        orderId: "{{$.order.extract.orderId}}"
        amount: "{{$.order.extract.totalAmount}}"
    expect:
      - identifier: "$.response.status"
        operator: equals
        expected: 201
```

For more workflow examples, see the [Examples](/examples/basic-testing) section.
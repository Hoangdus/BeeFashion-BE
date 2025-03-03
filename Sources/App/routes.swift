import Fluent
import Vapor

func routes(_ app: Application) throws {
    app.get { req async throws in
        try await req.view.render("index", ["title": "Hello Vapor!"])
    }
    
    app.get("hello") { req async -> String in
        "Hello, world!"
    }
    
    
    // customer
    app.post("auth", "register") { req async throws -> CustomerDTO in
        let registerDTO = try req.content.decode(RegisterDTO.self)
        
        // Check existing customer
        let existingCustomer = try await Customer.query(on: req.db).filter(\.$email == registerDTO.email).first()
        if existingCustomer != nil {
            throw Abort(.conflict, reason: "User already exists.")
        }
        
        // create a new customer
        let customer = Customer(fullName: registerDTO.fullName ,email: registerDTO.email, password: registerDTO.password)
        
        try await customer.save(on: req.db)
        return customer.toDTO()
    }
    
    app.post("auth", "login") {req async throws -> CustomerDTO in
        let loginDTO = try req.content.decode(LoginDTO.self)
        
        guard let customer = try await Customer.query(on: req.db).filter(\.$email == loginDTO.email).filter(\.$password == loginDTO.password).first() else { throw Abort(.notFound)}
        
        return customer.toDTO()
    }
    
    app.post("auth", "login_manager") {req async throws -> ManagerDTO in
        let loginDTO = try req.content.decode(LoginDTO.self)
        
        guard let manager = try await Manager.query(on: req.db).filter(\.$email == loginDTO.email).filter(\.$password == loginDTO.password).first() else { throw Abort(.notFound)}
        
        return manager.toDTO()
    }
    
    // manager
    app.post("auth", "register_manager") {req async throws -> Response in
        let registerDTO = try req.content.decode(ManagerRegisterDTO.self)
        
        // Check existing customer
        let existingManager = try await Manager.query(on: req.db).filter(\.$email == registerDTO.email).first()
        if existingManager != nil {
            throw Abort(.conflict, reason: "Manager email already exists.")
        }
        
        // create a new manager
        let manager = Manager(
            roleID: registerDTO.role,
            name: registerDTO.name,
            phone: registerDTO.phone,
            email: registerDTO.email,
            password: registerDTO.password
        )
        
        try await manager.save(on: req.db)
        
        let response = ["message": "Register successfully"]
        
        return Response(status: .ok, body: .init(data: try JSONEncoder().encode(response)))
    }
    
    try app.register(collection: SizeController())
    try app.register(collection: BrandController())
    try app.register(collection: CategoryController())
    try app.register(collection: ProductController())
    try app.register(collection: ProductDetailController())
    try app.register(collection: FavoriteController())
	try app.register(collection: CartController())
    try app.register(collection: CustomerController())
    try app.register(collection: AddressController())
    try app.register(collection: RoleController())
}

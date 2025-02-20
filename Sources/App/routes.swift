import Fluent
import Vapor

func routes(_ app: Application) throws {
    app.get { req async throws in
        try await req.view.render("index", ["title": "Hello Vapor!"])
    }

    app.get("hello") { req async -> String in
        "Hello, world!"
    }
    
    app.post("auth", "register") { req async throws -> Response in
        let registerDTO = try req.content.decode(RegisterDTO.self)
        
        // Check existing customer
        let existingCustomer = try await Customer.query(on: req.db).filter(\.$email == registerDTO.email).first()
        if existingCustomer != nil {
            throw Abort(.conflict, reason: "User already exists.")
        }
        
        // create a new customer
        let customer = Customer(fullName: registerDTO.fullName ,email: registerDTO.email, password: registerDTO.password)
        try await customer.save(on: req.db)
        
        let response = ["message": "Register successfully"]
                
        return Response(status: .ok, body: .init(data: try JSONEncoder().encode(response)))
    }
    
    app.post("auth", "login") {req async throws -> CustomerDTO in
        let loginDTO = try req.content.decode(LoginDTO.self)
        
        guard let customer = try await Customer.query(on: req.db).filter(\.$email == loginDTO.email).filter(\.$password == loginDTO.password).first() else { throw Abort(.notFound)}
        
        return customer.toDTO()
    }

    try app.register(collection: TodoController())
    try app.register(collection: CustomerController())
    try app.register(collection: AddressController())
}

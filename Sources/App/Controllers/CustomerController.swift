//
//  CustomerController.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 19/02/2025.
//

import Vapor
import Fluent
import FluentMongoDriver

struct CustomerController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let customerRoutes = routes.grouped("customers")
        let manageRoute = routes.grouped("admin", "customers")
        
        customerRoutes.put(":id", use: updateCustomer)
        manageRoute.get(":id", use: getByID)
    }
    
    @Sendable
    func getByID(req: Request) async throws -> CustomerDTO {
        guard let customer = try await Customer.find(req.parameters.get("id"), on: req.db) else {
            throw Abort(.notFound)
        }
        
        return customer.toDTO()
    }
    
    @Sendable func updateCustomer(_ req: Request) async throws -> CustomerDTO {
        guard let customer = try await Customer.find(req.parameters.get("id"), on: req.db) else {
            throw Abort(.notFound)
        }
        
        let updateData = try req.content.decode(UpdateCustomerRequest.self)
        
        if let image = updateData.image {
            let isImage = ["png", "jpeg", "jpg", "gif"].contains(image.extension?.lowercased())
            if !isImage {
                throw Abort(.badRequest, reason: "Invalid image format")
            }
            
            let formatter = DateFormatter()
            formatter.dateFormat = "dd-MM-yyyy-HH:mm:ss"
            let prefix = formatter.string(from: Date())
            
            let imageFileName = "image-\(prefix)-\(image.filename)"
            try await req.fileio.writeFile(image.data, at: "Public/images/\(imageFileName)")
            
            customer.image = "\(Environment.get("IMAGE_URL") ?? "http://127.0.0.1:8080/images/")\(imageFileName)"
        }
        
        customer.fullName = updateData.fullName ?? customer.fullName
        customer.email = updateData.email ?? customer.email
        customer.phone = updateData.phone ?? customer.phone
        customer.dateOfBirth = updateData.dateOfBirth ?? customer.dateOfBirth
        customer.gender = updateData.gender ?? customer.gender
        
        try await customer.save(on: req.db)
        return customer.toDTO()
    }
    
    
}

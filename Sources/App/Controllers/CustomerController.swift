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
        customerRoutes.put(":id", use: updateCustomer)
        
    }
    
    @Sendable func updateCustomer(_ req: Request) async throws -> CustomerDTO {
        guard let customer = try await Customer.find(req.parameters.get("id"), on: req.db) else {
            throw Abort(.notFound)
        }
        
        let updateData = try req.content.decode(CustomerDTO.self)
        
        customer.fullName = updateData.fullName ?? customer.fullName
        customer.email = updateData.email ?? customer.email
        customer.phone = updateData.phone
        customer.dateOfBirth = updateData.dateOfBirth
        customer.gender = updateData.gender
        
        try await customer.save(on: req.db)
        return updateData
    }
    
    
}

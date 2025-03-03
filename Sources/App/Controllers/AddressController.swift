//
//  AddressController.swift
//  BeeFashion-BE
//
//  Created by Nguyễn Hưng on 19/02/2025.
//

import Vapor
import Fluent
import FluentMongoDriver

struct AddressController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let addressRoutes = routes.grouped("addresses")
		
		addressRoutes.group(":customerId"){ address in
			address.get(use: getAllAddressByCustomerID)
			address.post(use: createAddress)
		}
		
        addressRoutes.group(":customerId", ":id") { address in
//            address.get(use: getAddressByID)
            address.put(use: updateAddress)
            address.delete(use: deleteAddress)
        }
    }
    
    @Sendable func getAllAddressByCustomerID(req: Request) async throws -> [AddressDTO] {
        guard let customerID = req.parameters.get("customerId", as: UUID.self) else {
                throw Abort(.badRequest, reason: "Invalid customer ID")
            }
//        let addresses = try await Address.query(on: req.db).all().map {
//            address in address.toDTO()
//        }
        
        let addresses = try await Address.query(on: req.db)
			.filter(\.$customer.$id == customerID)
                .all()
                .map { $0.toDTO() }
        
        return addresses
    }
    
//    @Sendable func getAddressByID(req: Request) async throws -> AddressDTO {
//        guard let address = try await Address.find(req.parameters.get("id"), on: req.db) else {
//            throw Abort(.notFound)
//        }
//        
//        return address.toDTO()
//    }
    
    @Sendable func createAddress(req: Request) async throws -> AddressDTO {
        guard let customerId = req.parameters.get("customerId", as: UUID.self) else {
            throw Abort(.badRequest, reason: "Invalid customer ID")
        }
            
        // check existing customer
        guard try await Customer.find(customerId, on: req.db) != nil else {
            throw Abort(.notFound, reason: "User not found")
        }
        
        let addressDTO = try req.content.decode(AddressDTO.self)
        let address = addressDTO.toModel(customerId: customerId)
        
        try await address.save(on: req.db)
        return address.toDTO()
    }
    
    @Sendable func deleteAddress(req: Request) async throws -> HTTPStatus {
		guard let customerId = req.parameters.get("customerId", as: UUID.self) else {
			throw Abort(.badRequest, reason: "Invalid customer ID")
		}
		
		guard try await Customer.find(customerId, on: req.db) != nil else {
			throw Abort(.notFound, reason: "User not found")
		}
		
        guard let deleteAddress = try await Address.find(req.parameters.get("id", as: UUID.self), on: req.db) else {
            throw Abort(.notFound)
        }
        
        try await deleteAddress.delete(on: req.db)
        return .ok
    }
    
    @Sendable func updateAddress(req: Request) async throws -> AddressDTO {
		guard let customerId = req.parameters.get("customerId", as: UUID.self) else {
			throw Abort(.badRequest, reason: "Invalid customer ID")
		}
		
		guard try await Customer.find(customerId, on: req.db) != nil else {
			throw Abort(.notFound, reason: "User not found")
		}
		
		
		guard let address = try await Address.find(req.parameters.get("id", as: UUID.self), on: req.db) else {
            throw Abort(.badRequest, reason: "ID not found")
        }
        
        let updateData = try req.content.decode(AddressDTO.self)
        
        address.province = updateData.province
        address.district = updateData.district
        address.ward = updateData.ward
        address.detail = updateData.detail
        
        try await address.save(on: req.db)
        return updateData
    }
}

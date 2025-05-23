//
//  BrandController.swift
//
//
//  Created by HoangDus on 20/02/2025.
//

import Fluent
import Vapor

struct BrandController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let brands = routes.grouped("brands")
		let manageBrands = routes.grouped("admin", "brands")
		
        brands.get(use: self.index)
		
		manageBrands.get(use: self.getAll)
        manageBrands.post(use: self.create)
        manageBrands.group(":brandID") { brand in
            brand.get(use: self.getByID)
			brand.put(use: self.update)
			brand.patch(use: self.restore)
            brand.delete(use: self.delete)
        }
    }

    @Sendable
    func index(req: Request) async throws -> [BrandDTO] {
        try await Brand.query(on: req.db).all().map { $0.toDTO() }
    }
	
	@Sendable
	func getAll(req: Request) async throws -> [BrandDTO] {
		try await Brand.query(on: req.db).withDeleted().all().map{ $0.toDTO() }
	}
    
    @Sendable
    func getByID(req: Request) async throws -> BrandDTO {
        guard let brandID = try await Brand.find(req.parameters.get("brandID"), on: req.db) else { throw Abort(.badRequest) }
        
        return brandID.toDTO()
    }

    @Sendable
    func create(req: Request) async throws -> BrandDTO {
        let brand = try req.content.decode(BrandDTO.self).toModel()

        try await brand.save(on: req.db)
        return brand.toDTO()
    }
	
	@Sendable
	func update(req: Request) async throws -> BrandDTO {
		let newBrandData = try req.content.decode(BrandDTO.self)

		guard let brand = try await Brand.find(req.parameters.get("brandID"), on: req.db) else { throw Abort(.notFound) }
		
		brand.name = newBrandData.name
		
		try await brand.save(on: req.db)
		return brand.toDTO()
	}

	@Sendable
	func restore(req: Request) async throws -> HTTPStatus {
		let brandID: UUID? = req.parameters.get("brandID")
		guard let brand = try await Brand.query(on: req.db).withDeleted().filter(\.$id == brandID!).first() else {
			throw Abort(.notFound)
		}

		try await brand.restore(on: req.db)
		return .noContent
	}
	
    @Sendable
    func delete(req: Request) async throws -> HTTPStatus {
		let brandID: UUID? = req.parameters.get("brandID")
		guard let brand = try await Brand.query(on: req.db).with(\.$products).filter(\.$id == brandID!).first() else {
			throw Abort(.notFound, reason: "brand not found")
		}
		
		let productsFromBrand: [Product]? = brand.$products.value
		if (productsFromBrand != nil) {
			try await productsFromBrand!.delete(on: req.db)
		}
		
        try await brand.delete(on: req.db)
        return .noContent
    }
}

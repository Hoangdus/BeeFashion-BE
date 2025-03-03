//
//  FavoriteController.swift
//
//
//  Created by HoangDus on 28/02/2025.
//

import Fluent
import Vapor

struct FavoriteController: RouteCollection {
	func boot(routes: RoutesBuilder) throws {
		let favorites = routes.grouped("favorites")
		
		favorites.group(":customerId"){
			$0.get(use: self.index)
		}
		
		favorites.group(":customerId", ":productId"){
			$0.post(use: self.create)
			$0.delete(use: self.delete)
		}
	}

	@Sendable
	func index(req: Request) async throws -> [ProductDTO] {
		guard let customerId: UUID = req.parameters.get("customerId") else { throw Abort(.badRequest) }
		
		guard let customer = try await Customer.query(on: req.db).with(\.$favProducts).filter(\.$id == customerId).first() else {
			throw Abort(.notFound)
		}
		let favProducts = customer.favProducts
		var productDTOs: [ProductDTO] = []
		
		for favProduct in favProducts{
			let productDetail = try await ProductDetail.query(on: req.db).filter(\.$product.$id == favProduct.id!).first()
			if (productDetail != nil){
				var productDTO = favProduct.toDTO()
				productDTO.quantities = productDetail!.quantities
				productDTO.price = productDetail!.price
				productDTO.isFavByCurrentUser = true
				productDTOs.append(productDTO)
			}
		}
		
		return productDTOs
	}

	@Sendable
	func create(req: Request) async throws -> HTTPStatus {
		guard let customerId: UUID = req.parameters.get("customerId") else { throw Abort(.badRequest) }
		guard let productId: UUID = req.parameters.get("productId") else { throw Abort(.badRequest) }
		
		guard let product = try await Product.find(productId, on: req.db) else { throw Abort(.notFound) }
		guard let customer = try await Customer.find(customerId, on: req.db) else { throw Abort(.notFound) }
		
		try await customer.$favProducts.attach(product, on: req.db)
		
		return .ok
	}

	@Sendable
	func delete(req: Request) async throws -> HTTPStatus {
		guard let customerId: UUID = req.parameters.get("customerId") else { throw Abort(.badRequest) }
		guard let productId: UUID = req.parameters.get("productId") else { throw Abort(.badRequest) }
		
		guard let product = try await Product.find(productId, on: req.db) else { throw Abort(.notFound) }
		guard let customer = try await Customer.find(customerId, on: req.db) else { throw Abort(.notFound) }
		
		try await customer.$favProducts.detach(product, on: req.db)
		
		return .ok
	}
}


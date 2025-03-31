//
//  CategoryController.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor

struct CategoryController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let categories = routes.grouped("categories")
		let manageCategories = routes.grouped("admin", "categories")
		
        categories.get(use: self.index)
		
		manageCategories.get(use: self.getAll)
        manageCategories.post(use: self.create)
        manageCategories.group(":categoryID") { category in
			category.put(use: self.update)
			category.patch(use: self.restore)
            category.delete(use: self.delete)
        }
    }

    @Sendable
    func index(req: Request) async throws -> [CategoryDTO] {
        try await Category.query(on: req.db).all().map { $0.toDTO() }
    }
	
	@Sendable
	func getAll(req: Request) async throws -> [CategoryDTO] {
		try await Category.query(on: req.db).withDeleted().all().map { $0.toDTO() }
	}

    @Sendable
    func create(req: Request) async throws -> CategoryDTO {
        let category = try req.content.decode(CategoryDTO.self).toModel()

        try await category.save(on: req.db)
        return category.toDTO()
    }

	@Sendable
	func update(req: Request) async throws -> CategoryDTO {
		let newCategoryData = try req.content.decode(CategoryDTO.self)

		guard let category = try await Category.find(req.parameters.get("categoryID"), on: req.db) else { throw Abort(.notFound) }
		
		category.name = newCategoryData.name
		
		try await category.save(on: req.db)
		return category.toDTO()
	}
	
	@Sendable
	func restore(req: Request) async throws -> HTTPStatus {
		guard let categoryID: UUID = req.parameters.get("categoryID") else { throw Abort(.badRequest) }
		guard let category = try await Category.query(on: req.db).withDeleted().filter(\.$id == categoryID).first() else {
			throw Abort(.notFound)
		}

		try await category.restore(on: req.db)
		return .noContent
	}
	
    @Sendable
    func delete(req: Request) async throws -> HTTPStatus {
        guard let category = try await Category.find(req.parameters.get("categoryID"), on: req.db) else {
            throw Abort(.notFound)
        }

        try await category.delete(on: req.db)
        return .noContent
    }
}

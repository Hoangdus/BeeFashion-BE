//
//  ProductDetailController.swift
//
//
//  Created by HoangDus on 19/02/2025.
//

import Fluent
import Vapor

struct ProductDetailController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        let productDetails = routes.grouped("productdetails")

        productDetails.get(use: self.index)
        productDetails.post(use: self.create)
        productDetails.group("getByProductID", ":productId"){ productId in
            productId.get(use: self.getByProductId)
        }
        productDetails.group(":productDetailID") { productDetail in
            productDetail.delete(use: self.delete)
        }
    }
    
    @Sendable
    func getByProductId(req: Request) async throws -> [ProductDetailDTO]{
        guard let uuidString = req.parameters.get("productId") else { throw Abort(.badRequest) }
        let productUUID = UUID(uuidString: uuidString)
        
        let productDetails = try await ProductDetail.query(on: req.db).filter(\.$product.$id == productUUID!).all()
        return productDetails.compactMap(){
            productDetail in productDetail.toDTO()
        }
    }

    @Sendable
    func index(req: Request) async throws -> [ProductDetailDTO] {
        try await ProductDetail.query(on: req.db).all().map { $0.toDTO() }
    }

    @Sendable
    func create(req: Request) async throws -> ProductDetailDTO {
        let productDetail = try req.content.decode(ProductDetailDTO.self).toModel()

        try await productDetail.save(on: req.db)
        return productDetail.toDTO()
    }

    @Sendable
    func delete(req: Request) async throws -> HTTPStatus {
        guard let productDetail = try await ProductDetail.find(req.parameters.get("productDetailID"), on: req.db) else {
            throw Abort(.notFound)
        }

        try await productDetail.delete(on: req.db)
        return .noContent
    }
}

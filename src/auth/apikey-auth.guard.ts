import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";


@Injectable()
export class APIKeyAuthGuard extends AuthGuard('api-key') {

    constructor () {
        super();
    }

    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    
}
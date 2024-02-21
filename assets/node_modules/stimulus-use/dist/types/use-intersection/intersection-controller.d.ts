import { Controller, Context } from '@hotwired/stimulus';
import { IntersectionOptions } from './use-intersection';
export declare class IntersectionComposableController extends Controller {
    appear?: (entry: IntersectionObserverEntry) => void;
    disappear?: (entry: IntersectionObserverEntry) => void;
    intersectionElements: Element[];
    isVisible: () => boolean;
    noneVisible: () => boolean;
    oneVisible: () => boolean;
    atLeastOneVisible: () => boolean;
    allVisible: () => boolean;
}
export declare class IntersectionController extends IntersectionComposableController {
    options?: IntersectionOptions;
    constructor(context: Context);
    observe: () => void;
    unobserve: () => void;
}
